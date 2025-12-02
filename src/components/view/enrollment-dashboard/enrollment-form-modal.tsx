import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import { createEnrollment, updateEnrollment } from "@/api/enrollment.api";
import type { Enrollment } from "@/types/enrollment";
import { getAcademies } from "@/api/academy.api";
import { getCourseByAcademy } from "@/api/course.api";
import { getMembers } from "@/api/member.api";
import { toast } from "@/hooks/use-toast";
import { format, addDays, parseISO, differenceInDays } from "date-fns";
import type { Course } from "@/types/course";
import { getDiscounts } from "@/api/discount.api";
import { getBatch } from "@/api/batch.api";
import type { Response } from "@/types/response";
import type { Batch } from "@/types/batch";
import { getActivities } from "@/api/activity.api";

type Props = {
  isOpen: boolean;
  initialData?: Enrollment;
  onClose: () => void;
  onSave: () => void;
};

interface SelectOption {
  value: number;
  label: string;
}

const toISO = (d?: Date | string | null) => {
  if (!d) return undefined;
  if (typeof d === "string") return d;
  return format(d, "yyyy-MM-dd");
};

const todayISO = () => format(new Date(), "yyyy-MM-dd");

const EMPTY = {
  enrollmentId: 0,
  enrollmentDate: todayISO(),
  startDate: todayISO(),
  endDate: undefined,
  academyId: 0,
  courseId: 0,
  memberId: 0,
  discountId: undefined,
  freeDays: 0,
  sessionUnits: 0,
  numberOfDays: 0,
  discountedAmount: 0,
  commitedAmount: 0,
  billingAmount: 0,
  billingRate: 0,
  cndn: undefined,
  discountPercentage: 0,
  openEnrollment: false,
  remarks: "",
  status: "active",
  // default keep discounts enabled to preserve previous behavior
  isDiscounted: true,
  adjustment: 0,
} as unknown as Enrollment & {
  isDiscounted?: boolean;
  discountPercentage?: number;
  adjustment?: number;
};

export default function EnrollmentFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<
    Enrollment & {
      isDiscounted?: boolean;
      discountPercentage?: number;
      adjustment?: number;
    }
  >(EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [academyOptions, setAcademyOptions] = useState<SelectOption[]>([]);
  const [courseOptions, setCourseOptions] = useState<SelectOption[]>([]);
  const [memberOptions, setMemberOptions] = useState<SelectOption[]>([]);
  const [courseArray, setCourseArray] = useState<Course[]>([]);
  const [batches, SetBatched] = useState<Batch[]>([]);
  const [activityOption, setActivityOption] = useState<SelectOption[]>([]);
  // store baseline original endDate from incoming initialData so freeDays changes don't compound
  const initialEndDateRef = useRef<string | undefined | any>(undefined);

  // derived value: minUnits of selected course
  const minUnits = useMemo(() => {
    const course = courseArray.find(
      (c) => c.courseId === Number(values.courseId)
    );
    const n = course
      ? Number(
        (course as any).minEnrollmentUnit ??
        (course as any).minEnrollmentUnit ??
        1
      )
      : 1;
    return Math.max(1, Number.isFinite(n) ? n : 1);
  }, [courseArray, values.courseId]);

  const unitAmount = useMemo(() => {
    const course = courseArray.find(
      (c) => c.courseId === Number(values.courseId)
    );
    const rate = course ? Number((course as any).unitRate ?? 1) : 1;
    return Math.max(1, Number.isFinite(rate) ? rate : 1);
  }, [courseArray, values.courseId]);

  // load static data (academies, members) and initial courses if editing
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const load = async () => {
      try {
        const [resMember, resActivity] = await Promise.all<any>([
          getMembers(),
          getActivities({
            limit: 100,
          }),
        ]);

        const activityArr = Array.isArray(resActivity?.data)
          ? resActivity?.data
          : [];
        if (!mounted) return;
        setActivityOption(
          activityArr.map((a: any) => ({
            value: String(a.activityName),
            label: a.activityName,
          }))
        );
        const memberArr = Array.isArray((resMember as any)?.data)
          ? (resMember as any).data
          : Array.isArray(resMember)
            ? resMember
            : [];
        if (!mounted) return;
        setMemberOptions(
          memberArr.map((m: any) => ({
            value: m.memberId,
            label: `${m.memberFirstName || ""} ${m.memberLastName || ""}`,
          }))
        );

        if (initialData?.academyId) {
          await loadCourses(initialData.academyId);
        }

        // set initial values after loading so dates are consistent
        const mapped = initialData ? mapIncoming(initialData) : { ...EMPTY };
        setValues(mapped);

        // set baseline endDate for edit-mode freeDays calculations (only when editing)
        initialEndDateRef.current = mapped.endDate;
      } catch (e) {
        console.error(e);
        toast({
          title: "Error",
          description: "Failed to load data.",
          variant: "destructive",
        });
      }
    };

    load();
    return () => {
      mounted = false;
      // clear baseline when modal closes to avoid stale value
      initialEndDateRef.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // helper: map server incoming enrollment to local shape (keeps date strings)
  const mapIncoming = (
    e: Enrollment
  ): Enrollment & {
    isDiscounted?: boolean;
    discountPercentage?: number;
    adjustment?: number;
  } => ({
    ...e,
    enrollmentDate: toISO(e.enrollmentDate as any) ?? todayISO(),
    startDate: toISO(e.startDate as any) ?? todayISO(),
    endDate: toISO(e.endDate as any),
    // preserve any incoming flag or default to true
    isDiscounted: (e as any).isDiscounted ?? true,
    discountPercentage: (e as any).discountPercentage ?? 0,
    billingAmount: (e as any).billingAmount ?? 0,
    billingRate: (e as any).billingRate ?? 0,
    cndn: (e as any).cndn ?? undefined,
    adjustment: (e as any).adjustment ?? 0,
  });

  const loadCourses = useCallback(
    async (academyId?: number) => {
      try {
        const courseRes = await getCourseByAcademy(
          academyId && academyId > 0 ? academyId : undefined
        );
        const arr = Array.isArray(courseRes.data) ? courseRes.data : [];
        setCourseArray(arr as Course[]);
        setCourseOptions(
          arr.map((c: any) => ({ value: c.courseId, label: c.courseName }))
        );

        // if current selected course is not in new list, clear it
        if (
          academyId &&
          values.courseId &&
          !arr.some((c: any) => c.courseId === values.courseId)
        ) {
          setValues((p) => ({ ...p, courseId: 0 }));
        }
      } catch (e) {
        console.error(e);
        toast({
          title: "Error",
          description: "Failed to load courses.",
          variant: "destructive",
        });
        setCourseOptions([]);
        setCourseArray([]);
      }
    },
    [values.courseId]
  );
  // helper: load academies filtered by activity and update academyOptions
  const loadAcademiesByActivity = useCallback(
    async (activityName?: string) => {
      try {
        console.log(activityName);

        const res = await getAcademies({
          academyType: activityName ? activityName : undefined,
        });

        console.log(res);

        const arr = Array.isArray((res as any)?.data)
          ? (res as any).data
          : Array.isArray(res)
            ? res
            : [];

        // map to SelectOption (adjust to string if your Select expects strings)
        const mapped = arr.map((a: any) => ({
          value: a.academyId,
          label: a.academyName || a.name || `Academy ${a.academyId}`,
        })) as SelectOption[];

        setAcademyOptions(mapped);

        // if there's exactly one academy, auto-select it and load courses for it
        if (mapped.length === 1) {
          const only = mapped[0];
          setValues((p) => ({
            ...p,
            academyId: only.value,
            courseId: 0, // reset course
          }));
          // load courses for that academy so courseOptions and courseArray fill
          await loadCourses(Number(only.value));
        }
      } catch (e) {
        console.error("Failed to load academies for activity:", e);
        toast({
          title: "Error",
          description: "Failed to load academies.",
          variant: "destructive",
        });
        setAcademyOptions([]);
      }
    },
    [loadCourses]
  );

  // helper to compute billingRate and billingAmount given discountPercentage, cndn, numberOfDays, unitAmount
  const computeBilling = (
    discountPercentage: number,
    cndnNumber: number | undefined,
    numDays: number,
    unitRate: number
  ) => {
    // discountPercentage is a percent (e.g., 10 for 10%)
    const discPerc = Number(discountPercentage) || 0;
    const cndnNumberSafe = Number(cndnNumber) || 0;
    const days = numDays > 0 ? numDays : 1;

    // billingRate formula provided: ((course.unitRate * discountPercentage)/100) - (cndn/numberOfDays)
    const billingRateCalc = (unitRate * discPerc) / 100 - cndnNumberSafe / days;

    // ensure billingRate is integer (round to nearest)
    const billingRateRounded = Number.isFinite(billingRateCalc)
      ? Math.round(billingRateCalc * 100) / 100 // Round to 2 decimal places
      : 0;

    // billingAmount uses the rounded billingRate so it stays consistent as integer * days
    const billingAmountCalc = billingRateRounded * days;

    return {
      billingRate: billingRateRounded,
      billingAmount: Number.isFinite(billingAmountCalc) ? billingAmountCalc : 0,
    };
  };

  // compute endDate string whenever startDate or selected course (minUnits) changes
  useEffect(() => {
    if (!values.startDate) return;

    let startDateObj: Date;
    if (typeof values.startDate === "string") {
      startDateObj = parseISO(values.startDate);
    } else {
      startDateObj = new Date(values.startDate as any);
    }

    const computed = addDays(startDateObj, minUnits - 1);
    const computedStr = format(computed, "yyyy-MM-dd");
    if (values.endDate !== computedStr) {
      // also compute billing here (commitedAmount must remain base)
      const days = minUnits;
      const baseCommitedAmount = days * unitAmount;
      const { billingRate, billingAmount } = computeBilling(
        Number(values.discountPercentage) || 0,
        Number(values.cndn) || 0,
        days,
        unitAmount
      );
      const localBill = Math.ceil(billingAmount);
      const adjustment = Math.round((localBill - billingAmount) * 100) / 100;

      setValues((p: any) => ({
        ...p,
        endDate: computedStr,
        numberOfDays: days,
        billingRate,
        billingAmount: localBill,
        commitedAmount: baseCommitedAmount,
        adjustment,
      }));
    }
    // Note: this effect intentionally does not touch initialEndDateRef
  }, [values.startDate, minUnits]);

  // when course changes, update committed amount (course.unitRate * numberOfDays) and ensure courses loaded
  useEffect(() => {
    if (!values.courseId) return;
    const course = courseArray.find(
      (c) => c.courseId === Number(values.courseId)
    );
    const currentUnitRate = course
      ? Number((course as any).unitRate ?? 1)
      : unitAmount;
    const days = Number(values.numberOfDays) || 0;
    const baseCommitedAmount = days * currentUnitRate;
    // recompute billing as well
    const { billingRate, billingAmount } = computeBilling(
      Number(values.discountPercentage) || 0,
      Number(values.cndn) || 0,
      days,
      currentUnitRate
    );

    const localBill = Math.ceil(billingAmount);
    const adjustment = Math.round((localBill - billingAmount) * 100) / 100;

    setValues((p) => ({
      ...p,
      commitedAmount: baseCommitedAmount,
      billingRate,
      billingAmount: localBill,
      adjustment,
    }));
  }, [values.courseId, courseArray]); // unitAmount will update because courseArray changed

  const onChange = (field: keyof Enrollment | "isDiscounted", val: any) => {
    if (field === "activityName") {
      const activityName = val || 0;
      // set activity and clear dependent selects
      setValues((p) => ({
        ...p,
        activityName,
        academyId: 0,
        courseId: 0,
        batchId: 0,
      }));

      // clear any previous errors on academy/course
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy["activityName"];
        delete copy["academyId"];
        delete copy["courseId"];
        return copy;
      });

      // load academies for selected activity (fire-and-forget)
      void loadAcademiesByActivity(activityName);
      return;
    }

    // academy change: load courses for academy and reset course selection
    if (field === "academyId") {
      const academyId = Number(val) || 0;
      setValues((p) => ({ ...p, academyId, courseId: 0 }));
      loadCourses(academyId);
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[field as string];
        return copy;
      });
      return;
    }

    if (field === "startDate" || field === "endDate") {
      const startVal = field === "startDate" ? val : values.startDate;
      const endVal = field === "endDate" ? val : values.endDate;

      // if either date is missing, set numberOfDays to 0 and update the changed field
      if (!startVal || !endVal) {
        setValues((p) => ({ ...p, [field]: val, numberOfDays: 0 }));
        return;
      }

      // parse values to Date objects (handles 'yyyy-MM-dd' strings and Date objects)
      const startDateObj =
        typeof startVal === "string"
          ? parseISO(startVal)
          : new Date(startVal as any);
      const endDateObj =
        typeof endVal === "string" ? parseISO(endVal) : new Date(endVal as any);

      // compute inclusive day difference (include both start and end)
      let days = differenceInDays(endDateObj, startDateObj) + 1;
      days = Number.isFinite(days) ? days : 0;

      // if difference less than minUnits, force endDate = startDate + (minUnits - 1)
      if (days < minUnits) {
        days = Math.max(minUnits, 1);
        const forcedEnd = addDays(startDateObj, days - 1); // end = start + minUnits - 1
        const forcedEndStr = format(forcedEnd, "yyyy-MM-dd");

        // compute base committed amount (always unitRate * numberOfDays)
        const baseCommitedAmount = days * unitAmount;
        // compute billing regardless of discount checkbox (discountPercentage might be 0)
        const { billingRate, billingAmount } = computeBilling(
          Number(values.discountPercentage) || 0,
          Number(values.cndn) || 0,
          days,
          unitAmount
        );

        const localBill = Math.ceil(billingAmount);
        const adjustment = Math.round((localBill - billingAmount) * 100) / 100;

        setValues((p: any) => ({
          ...p,
          [field]: val,
          endDate: forcedEndStr,
          numberOfDays: days,
          billingRate,
          billingAmount: localBill,
          commitedAmount: baseCommitedAmount,
          adjustment,
        }));
        return;
      }

      // otherwise just set the changed field and computed numberOfDays, and recompute billing
      const baseCommitedAmount = days * unitAmount;
      const { billingRate, billingAmount } = computeBilling(
        Number(values.discountPercentage) || 0,
        Number(values.cndn) || 0,
        days,
        unitAmount
      );
      const localBill = Math.ceil(billingAmount);
      const adjustment = Math.round((localBill - billingAmount) * 100) / 100;
      setValues((p) => ({
        ...p,
        [field]: val,
        numberOfDays: days,
        billingRate,
        billingAmount: localBill,
        commitedAmount: baseCommitedAmount,
        adjustment,
      }));
      return;
    }

    if (field === "numberOfDays") {
      const startDateObj =
        typeof values.startDate === "string"
          ? parseISO(values.startDate)
          : new Date(values.startDate as any);
      const newEndDate = addDays(startDateObj, Number(val) - 1);
      const newEndDateStr = format(newEndDate, "yyyy-MM-dd");

      // compute billing with new numberOfDays
      const newDays = Number(val) || 0;
      const baseCommitedAmount = newDays * unitAmount;
      const { billingRate, billingAmount } = computeBilling(
        Number(values.discountPercentage) || 0,
        Number(values.cndn) || 0,
        newDays,
        unitAmount
      );

      const localBill = Math.ceil(billingAmount);
      const adjustment = Math.round((localBill - billingAmount) * 100) / 100;

      setValues((p: any) => ({
        ...p,
        numberOfDays: Number(val),
        endDate: newEndDateStr,
        billingRate,
        billingAmount: localBill,
        commitedAmount: baseCommitedAmount,
        adjustment,
      }));
      return;
    }

    if (field === "isDiscounted") {
      // when toggling discount checkbox, we must still calculate billing (using discountPercentage or 0)
      const newIsDiscounted = Boolean(val);
      setValues((p) => ({ ...p, isDiscounted: newIsDiscounted }));
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy["isDiscounted"];
        return copy;
      });

      // recompute billing using discountPercentage (if we have one) else 0
      const days = Number(values.numberOfDays) || 0;
      const discPerc = newIsDiscounted
        ? Number(values.discountPercentage) || 0
        : 0;
      const { billingRate, billingAmount } = computeBilling(
        discPerc,
        Number(values.cndn) || 0,
        days,
        unitAmount
      );
      const baseCommitedAmount = days * unitAmount;
      const localBill = Math.ceil(billingAmount);
      const adjustment = Math.round((localBill - billingAmount) * 100) / 100;

      setValues((p) => ({
        ...p,
        billingRate,
        billingAmount: localBill,
        commitedAmount: baseCommitedAmount,
        adjustment,
      }));
      return;
    }

    if (field === "freeDays") {
      const freeDaysNumber = Number(val) || 0;

      if (initialEndDateRef.current) {
        // parse baseline endDate (expected 'yyyy-MM-dd' or Date-like)
        let baseEndDate: Date | null = null;
        try {
          baseEndDate = initialEndDateRef.current
            ? parseISO(initialEndDateRef.current)
            : null;
        } catch {
          baseEndDate = values.endDate
            ? typeof values.endDate === "string"
              ? parseISO(values.endDate)
              : new Date(values.endDate as any)
            : null;
        }

        if (baseEndDate) {
          // New end date = baseline end date + freeDays
          const newEnd = addDays(baseEndDate, freeDaysNumber);
          const newEndStr = format(newEnd, "yyyy-MM-dd");
          setValues((p: any) => ({
            ...p,
            freeDays: freeDaysNumber,
            endDate: newEndStr,
            // numberOfDays intentionally unchanged
          }));
        } else {
          // fallback: just set freeDays
          setValues((p) => ({ ...p, freeDays: freeDaysNumber }));
        }
      } else {
        // not editing existing enrollment — keep previous behavior: set freeDays but don't alter numberOfDays here
        setValues((p) => ({ ...p, freeDays: freeDaysNumber }));
      }

      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy["freeDays"];
        return copy;
      });

      return;
    }

    if (field === "cndn") {
      const cndnNumber = Number(val) || 0;
      const days = Number(values.numberOfDays) || 0;
      // discountPercentage used only if isDiscounted true, otherwise 0
      const discPerc = values.isDiscounted
        ? Number(values.discountPercentage) || 0
        : 0;
      const { billingRate, billingAmount } = computeBilling(
        discPerc,
        cndnNumber,
        days,
        unitAmount
      );

      const baseCommitedAmount = days * unitAmount;
      const localBill = Math.ceil(billingAmount);
      const adjustment = Math.round((localBill - billingAmount) * 100) / 100;

      setValues((p) => ({
        ...p,
        cndn: cndnNumber,
        billingRate,
        billingAmount: localBill,
        commitedAmount: baseCommitedAmount,
        adjustment,
      }));

      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy["cndn"];
        return copy;
      });

      return;
    }
    if (field === "batchId") {
      const batchId = val ? Number(val) : 0;
      setValues((p) => ({ ...p, batchId }));
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy["batchId"];
        return copy;
      });

      return;
    }

    // generic fallback for other fields
    // if user edits discountedAmount or commitedAmount directly (rare), recompute adjustment
    if (
      field === "discountedAmount" ||
      field === "commitedAmount" ||
      field === "billingAmount"
    ) {
      const next = { ...(values as any), [field]: val };
      const commited = Number(next.commitedAmount) || 0;
      const discountAmt = Number(next.discountedAmount) || 0;
      const billingAmt = Number(next.billingAmount) || 0;
      const adjustment = commited - discountAmt - billingAmt;
      setValues((p) => ({ ...p, [field]: val, adjustment }));
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[field as string];
        return copy;
      });
      return;
    }

    setValues((p) => ({ ...p, [field]: val }));
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[field as string];
      return copy;
    });
  };

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!values.academyId || Number(values.academyId) === 0)
      errs.academyId = "Academy is required";
    if (!values.courseId || Number(values.courseId) === 0)
      errs.courseId = "Course is required";
    if (!values.batchId || Number(values.batchId) === 0)
      errs.courseId = "Batch is required";
    if (!values.memberId || Number(values.memberId) === 0)
      errs.memberId = "Member is required";
    if (!values.startDate) errs.startDate = "Start date is required";
    if (!values.commitedAmount || Number(values.commitedAmount) === 0)
      errs.commitedAmount = "Commited amount is required";
    if (!values.status || String(values.status).trim() === "")
      errs.status = "Status is required";
    return errs;
  }, [values]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setIsSubmitting(false);
      return;
    }

    try {
      // include discount fields only when isDiscounted is true
      const payload: Partial<Enrollment & { isDiscounted?: boolean }> = {
        academyId: Number(values.academyId),
        courseId: Number(values.courseId),
        memberId: Number(values.memberId),
        enrollmentDate: values.enrollmentDate,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        ...(values.isDiscounted
          ? {
            discountId: values.discountId || undefined,
            discountedAmount: Number(values.discountedAmount) || 0,
          }
          : {}),
        freeDays: Number(values.freeDays) || 0,
        sessionUnits: Number(values.sessionUnits) || 0,
        numberOfDays: Number(values.numberOfDays) || 0,
        commitedAmount: Number(values.commitedAmount) || 0,
        openEnrollment: Boolean(values.openEnrollment) || false,
        remarks: values.remarks || undefined,
        status: values.status,
        isDiscounted: Boolean(values.isDiscounted),

        // billing fields: use recomputed final values (guaranteed present)
        billingAmount: values.billingAmount || 0, // integer
        billingRate: values.billingRate || 0, // float
        cndn:
          (values as any).cndn === undefined || (values as any).cndn === null
            ? undefined
            : Number((values as any).cndn),
        adjustment: values.adjustment || 0, // rounding delta (2 dp)
        batchId: values.batchId || undefined,
      };

      console.log("Enrollment payload:", payload);

      if (initialData?.enrollmentId) {
        await updateEnrollment(initialData.enrollmentId, payload as any);
        toast({
          title: "Success",
          description: "Enrollment updated successfully",
        });
      } else {
        await createEnrollment(payload as any);
        toast({
          title: "Success",
          description: "Enrollment created successfully",
        });
      }

      onSave();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, values, initialData, onSave, onClose]);

  const fields = [
    {
      name: "memberId",
      label: "Member",
      type: "select",
      options: memberOptions,
      required: true,
    },
    {
      name: "activityName",
      label: "Activity Name",
      type: "select",
      options: activityOption, // correct key
      required: true, // correct key
    },
    {
      name: "academyId",
      label: "Academy",
      type: "select",
      options: academyOptions,
      required: true,
    },
    {
      name: "courseId",
      label: "Course",
      type: "select",
      options: courseOptions,
      required: true,
    },
    {
      name: "batchId",
      label: "Batch",
      type: "select",
      options: batches.map((b) => ({
        // label: b.batchName,
        label: b.batchName + "|" + b.startTime + " To " + b.endTime,
        value: Number(b.batchId),
      })),
      required: true,
    },
    {
      name: "enrollmentDate",
      label: "Enrollment Date",
      type: "date",
      required: true,
    },
    {
      name: "startDate",
      label: "Start Date",
      type: "date",
      required: true,
      disabled: initialData ? true : false,
    },
    {
      name: "endDate",
      label: "End Date",
      type: "date",
      required: false,
      disabled: initialData ? true : false,
    },
    ...(initialData
      ? [
        {
          name: "freeDays",
          label: "Free Days",
          type: "number",
          required: false,
        },
      ]
      : []),
    {
      name: "sessionUnits",
      label: "Session Units",
      type: "number",
      required: false,
    },
    {
      name: "numberOfDays",
      label: "Number Of Days",
      type: "number",
      required: false,
    },
    {
      name: "discountId",
      label: "Discount ID",
      type: "number",
      required: false,
    },
    {
      name: "isDiscounted",
      label: "do you want to apply discount",
      type: "checkbox",
      required: false,
    },
    {
      name: "discountedAmount",
      label: "Discounted Amount",
      type: "number",
      required: false,
      disabled: true,
    },
    {
      name: "commitedAmount",
      label: "Commited Amount",
      type: "number",
      required: true,
      disabled: true,
    },
    // --- billing fields (ui + logic wiring) ---
    {
      name: "billingAmount",
      label: "Billing Amount",
      type: "number",
      required: false,
      disabled: true, // computed
    },
    {
      name: "billingRate",
      label: "Billing Rate",
      type: "number",
      required: false,
      disabled: true, // computed and integer
    },
    {
      name: "cndn",
      label: "CNDN",
      type: "number",
      required: false,
    },
    // --- adjustment field ---
    {
      name: "adjustment",
      label: "Adjustment",
      type: "number",
      required: false,
      disabled: true,
    },
    // --- end billing fields ---
    {
      name: "openEnrollment",
      label: "Open Enrollment",
      type: "checkbox",
      required: false,
    },
    { name: "remarks", label: "Remarks", type: "textarea", required: false },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Completed", value: "completed" },
      ],
      required: true,
    },
  ] as any;

  const getDiscountDate = useCallback(async () => {
    // if user opted out, still try to fetch discounts? original code skipped when !values.isDiscounted.
    // We keep that behavior (we won't fetch discounts when isDiscounted=false), but billing will still compute with discountPercentage=0.
    if (!values.isDiscounted) return undefined;
    try {
      const discounts = await getDiscounts({
        courseId: values.courseId ? Number(values.courseId) : undefined,
        sortBy: "aboveUnits",
        sortOrder: "DESC",
        status: "active",
        aboveUnits: values.numberOfDays
          ? Number(values.numberOfDays)
          : undefined,
      });
      return discounts;
    } catch (error) {
      console.error("Error fetching discounts:", error);
      return undefined;
    }
  }, [values.courseId, values.numberOfDays, values.isDiscounted]);

  useEffect(() => {
    const load = async () => {
      // Calculate base committed amount (always course.unitRate * numberOfDays)
      const baseCommitedAmount = Number(values.numberOfDays) * unitAmount;

      // compute billing regardless of isDiscounted (use discountPercentage if present and isDiscounted true, else 0)
      const discPerc = values.isDiscounted
        ? Number(values.discountPercentage) || 0
        : 0;

      // If discounts enabled, fetch discount data and prefer its percentage (but do NOT overwrite commitedAmount)
      if (values.isDiscounted) {
        const discounts: Response = await getDiscountDate();
        if (
          discounts &&
          Array.isArray(discounts.data) &&
          discounts.data.length > 0
        ) {
          const discount = discounts.data[0];
          const usedDiscountPerc = Number(discount.discountPercentage) || 0;
          const { billingRate, billingAmount } = computeBilling(
            usedDiscountPerc,
            Number(values.cndn) || 0,
            Number(values.numberOfDays) || 0,
            unitAmount
          );
          const discountedAmt = (baseCommitedAmount * usedDiscountPerc) / 100;
          const localBill = Math.ceil(billingAmount);
          const adjustment =
            Math.round((localBill - billingAmount) * 100) / 100;

          setValues((p) => ({
            ...p,
            // commitedAmount must remain base (unitRate * numberOfDays)
            commitedAmount: baseCommitedAmount,
            discountId: discount.discountId,
            discountedAmount: discountedAmt,
            discountPercentage: usedDiscountPerc,
            billingRate,
            billingAmount: localBill,
            adjustment,
          }));
          return;
        }
      }

      // default path (no discount applied or discounts not found)
      const { billingRate, billingAmount } = computeBilling(
        discPerc,
        Number(values.cndn) || 0,
        Number(values.numberOfDays) || 0,
        unitAmount
      );
      const discountedAmt = values.isDiscounted
        ? Number(values.discountedAmount) || 0
        : 0;
      const localBill = Math.ceil(billingAmount);
      const adjustment = Math.round((localBill - billingAmount) * 100) / 100;

      setValues((p) => ({
        ...p,
        commitedAmount: baseCommitedAmount,
        discountId: values.isDiscounted ? values.discountId : undefined,
        discountedAmount: discountedAmt,
        discountPercentage: discPerc,
        billingRate,
        billingAmount: localBill,
        adjustment,
      }));
    };

    load();
    // intentionally depends on numberOfDays, unitAmount, getDiscountDate, values.isDiscounted, and values.cndn
  }, [values.numberOfDays, unitAmount, values.isDiscounted, values.cndn]);

  useEffect(() => {
    const getBatches = async () => {
      try {
        const res: Response = await getBatch({
          courseId: Number(values.courseId),
        });
        const data = res.data || [];
        SetBatched(data);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load batches",
          variant: "destructive",
        });
      }
    };
    getBatches();
  }, [values.courseId]);
  if (!isOpen) return null;

  return (
    <div className="flex flex-col max-h-[90vh] overflow-hidden">
      {/* <FormHeader
        title={
          initialData?.enrollmentId
            ? "Edit Enrollment"
            : "Add New Enrollment"
        }
        onClose={onClose}
      /> */}
      <div className="overflow-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}
        <FormContent
          fields={fields}
          values={values}
          errors={fieldErrors}
          loading={false}
          error={error}
          isSubmitting={isSubmitting}
          onChange={
            onChange as (field: keyof Enrollment, value: any) => void
          }
          layout="grid"
        />
      </div>
      <FormFooter
        onClose={onClose}
        onSubmit={handleSubmit}
        submitLabel={initialData?.enrollmentId ? "Update" : "Create"}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
