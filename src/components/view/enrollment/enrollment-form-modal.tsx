import { useCallback, useEffect, useMemo, useState } from "react";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import { createEnrollment, updateEnrollment } from "@/api/enrollment.api";
import type { Enrollment } from "@/types/enrollment";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getAcademies } from "@/api/academy.api";
import { getCourseByAcademy } from "@/api/course.api";
import { getMembers } from "@/api/member.api";
import { toast } from "@/hooks/use-toast";
import { format, addDays, parseISO, differenceInDays } from "date-fns";
import type { Course } from "@/types/course";
import { getDiscounts } from "@/api/discount.api";
import type { Response } from "@/types/response";
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
  openEnrollment: false,
  remarks: "",
  status: "active",
} as unknown as Enrollment;

export default function EnrollmentFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<Enrollment>(EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [academyOptions, setAcademyOptions] = useState<SelectOption[]>([]);
  const [courseOptions, setCourseOptions] = useState<SelectOption[]>([]);
  const [memberOptions, setMemberOptions] = useState<SelectOption[]>([]);
  const [courseArray, setCourseArray] = useState<Course[]>([]);

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
        const [resAcademy, resMember] = await Promise.all([
          getAcademies(),
          getMembers(),
        ]);

        const academyArr = Array.isArray(resAcademy) ? resAcademy : [];
        if (!mounted) return;
        setAcademyOptions(
          academyArr.map((a: any) => ({
            value: a.academyId,
            label: a.academyName,
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
        setValues(initialData ? mapIncoming(initialData) : { ...EMPTY });
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // helper: map server incoming enrollment to local shape (keeps date strings)
  const mapIncoming = (e: Enrollment): Enrollment => ({
    ...e,
    enrollmentDate: toISO(e.enrollmentDate as any) ?? todayISO(),
    startDate: toISO(e.startDate as any) ?? todayISO(),
    endDate: toISO(e.endDate as any),
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
      setValues((p) => ({
        ...p,
        endDate: computedStr,
        numberOfDays: minUnits,
      }));
    }
  }, [values.startDate, minUnits]);

  // when course changes, update committed amount (fees) and ensure courses loaded
  useEffect(() => {
    if (!values.courseId) return;
    const course = courseArray.find(
      (c) => c.courseId === Number(values.courseId)
    );
    setValues((p) => ({
      ...p,
      commitedAmount: Number((course as any)?.fees) || p.commitedAmount || 0,
    }));
  }, [values.courseId, courseArray]);

  const onChange = (field: keyof Enrollment, val: any) => {
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
        setValues((p) => ({
          ...p,
          [field]: val,
          endDate: forcedEndStr,
          numberOfDays: days,
        }));
        return;
      }

      // otherwise just set the changed field and computed numberOfDays
      setValues((p) => ({ ...p, [field]: val, numberOfDays: days }));
      return;
    }

    if (field === "numberOfDays") {
      const startDateObj =
        typeof values.startDate === "string"
          ? parseISO(values.startDate)
          : new Date(values.startDate as any);
      const newEndDate = addDays(startDateObj, Number(val) - 1);
      const newEndDateStr = format(newEndDate, "yyyy-MM-dd");
      setValues((p) => ({
        ...p,
        numberOfDays: Number(val),
        endDate: newEndDateStr,
      }));
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
      const payload: Partial<Enrollment> = {
        academyId: Number(values.academyId),
        courseId: Number(values.courseId),
        memberId: Number(values.memberId),
        enrollmentDate: values.enrollmentDate,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        discountId: values.discountId || undefined,
        freeDays: Number(values.freeDays) || 0,
        sessionUnits: Number(values.sessionUnits) || 0,
        numberOfDays: Number(values.numberOfDays) || 0,
        discountedAmount: Number(values.discountedAmount) || 0,
        commitedAmount: Number(values.commitedAmount) || 0,
        openEnrollment: Boolean(values.openEnrollment) || false,
        remarks: values.remarks || undefined,
        status: values.status,
      };

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
      name: "memberId",
      label: "Member",
      type: "select",
      options: memberOptions,
      required: true,
    },
    {
      name: "enrollmentDate",
      label: "Enrollment Date",
      type: "date",
      required: true,
    },
    { name: "startDate", label: "Start Date", type: "date", required: true },
    { name: "endDate", label: "End Date", type: "date", required: false },
    { name: "freeDays", label: "Free Days", type: "number", required: false },
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
  }, [values.courseId, values.numberOfDays]);

  useEffect(() => {
    const load = async () => {
      // Calculate base committed amount
      const baseCommitedAmount = values.numberOfDays * unitAmount;

      // wait for the API call to finish
      const discounts = await getDiscountDate();
      if (discounts && Array.isArray(discounts) && discounts[0]) {
        const discount = discounts[0];
        const finalAmount =
          (baseCommitedAmount * discount.discountPercentage) / 100;
        console.log(finalAmount, " final amount");
        setValues((p) => ({
          ...p,
          commitedAmount: baseCommitedAmount - finalAmount,
          discountId: discount.discountId,
          discountedAmount: finalAmount,
        }));
      } else {
        setValues((p) => ({
          ...p,
          commitedAmount: baseCommitedAmount,
          discountId: undefined,
          discountedAmount: 0,
        }));
      }
    };

    load();
  }, [values.numberOfDays, unitAmount, getDiscountDate]);

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <div>
        <DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
          <div className="flex flex-col max-h-[90vh] overflow-hidden">
            <FormHeader
              title={
                initialData?.enrollmentId
                  ? "Edit Enrollment"
                  : "Add New Enrollment"
              }
              onClose={onClose}
            />
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
        </DialogContent>
      </div>
    </Dialog>
  );
}
