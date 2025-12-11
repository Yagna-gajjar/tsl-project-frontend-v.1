import { useCallback, useEffect, useState } from "react";

import { FormContent } from "@/components/form-modal/form-content";
import { FormFooter } from "@/components/form-modal/form-footer";

import type { Academy } from "@/types/academy";
import type { Activity } from "@/types/activity";
import type { Batch } from "@/types/batch";
import type { Course } from "@/types/course";
import type { Member } from "@/types/member";
import type { Enrollment } from "@/types/enrollment";
import type { Discount } from "@/types/discount";
import type { Response } from "@/types/response";

import { getMembers } from "@/api/member.api";
import { getActivities } from "@/api/activity.api";
import { getAcademies } from "@/api/academy.api";
import { getCourses } from "@/api/course.api";
import { getBatch } from "@/api/batch.api";
import { getAcademyCoaches } from "@/api/academyCoach.api";
import { getDiscounts } from "@/api/discount.api";
import { createEnrollment } from "@/api/enrollment.api";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { DebitNote } from "@/types/debitNote";
import type { Coach } from "@/types/coach";

import BatchRequestedForm from "@/components/view/enrollment-actions/BatchRequestedForm";

const EnrollmentFormNew = ({
  memberId,
  memberName,
  onBatchSelect,
}: {
  memberId: number;
  memberName: string;
  onBatchSelect: (id: number) => void;
}) => {
  const [error, setError] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [academy, setAcademy] = useState<Academy[]>([]);
  const [allAcademies, setAllAcademies] = useState<Academy[]>([]);
  const [course, setCourse] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [discount, setDiscount] = useState<Discount>();
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<Course>();
  const [coaches, setCoaches] = useState<Coach[]>([]);

  const [showBatchRequest, setShowBatchRequest] = useState(false);
  const [requestBatchDetails, setRequestBatchDetails] = useState<{
    batchId: number;
    batchName: string;
  } | null>(null);

  const [values, setValues] = useState<Enrollment>({
    memberId: Number(memberId),
    memberName: memberName ?? "Not Selected",
    academyId: 0,
    adjustment: 0,
    batchId: 0,
    billingAmount: 0,
    billingRate: 0,
    cndn: 0,
    debitAmount: 0,
    commitedAmount: 0,
    courseId: 0,
    discountedAmount: 0,
    endDate: 0 as any,
    enrollmentDate: format(Date.now(), "yyyy-MM-dd") as any,
    enrollmentId: 0,
    freeDays: 0,
    numberOfDays: 0,
    openEnrollment: false,
    sessionUnits: 0,
    startDate: format(Date.now(), "yyyy-MM-dd") as any,
    status: "active",
    batchName: "",
  });

  const [debouncedDays, setDebouncedDays] = useState(values.numberOfDays);
  const [debouncedCndn, setDebouncedCndn] = useState(values.cndn);
  const [debouncedDebitAmount, setDebouncedDebitAmount] = useState(
    values.debitAmount
  );

  const [debitNoteAcademyId, setDebitNoteAcademyId] = useState<number>(0);

  const [debitNoteValues, setDebitNoteValues] = useState<
    DebitNote & { debitNoteAcademyId?: number }
  >({
    debitNoteDate: format(Date.now(), "yyyy-MM-dd") as any,
    academyId: 0,
    debitNoteAcademyId: 0,
    debitNoteType: "",
    coachId: null,
    debitNoteAmount: 0,
    debitNoteRemarks: "",
  });

  const [paymentValues, setPaymentValues] = useState({
    paymentType: "Reciept",
    paymentMode: "cash",
    transactionId: "" as string | null,
    paid: 0,
    remaining: 0,
    paymentRemarks: "" as string | null,
  });

  const navigate = useNavigate();

  const AdjustBillingAmount = (amount: number) => {
    const roundedAmount = Math.ceil(amount);
    const newAdjust = roundedAmount - amount;

    return {
      amount: Number(roundedAmount.toFixed(2)),
      adjust: Number(newAdjust.toFixed(2)),
    };
  };

  const isCourseChargingBySession = (c?: Course | null) => {
    if (!c) return false;
    const maybe =
      (c as any).chargingPattern ??
      (c as any).chargePattern ??
      (c as any).chargingType ??
      (c as any).chargeBy;
    if (typeof maybe === "string") return maybe.toLowerCase() === "session";
    if (typeof maybe === "boolean") return Boolean(maybe);
    if ((c as any).chargePerSession !== undefined)
      return Boolean((c as any).chargePerSession);
    return false;
  };

  const getActiveUnits = (vals = values, courseObj = selectedCourse) => {
    return isCourseChargingBySession(courseObj)
      ? Number(vals.sessionUnits || 0)
      : Number(vals.numberOfDays || 0);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDays(values.numberOfDays);
    }, 400);

    return () => clearTimeout(handler);
  }, [values.numberOfDays]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCndn(values.cndn);
    }, 400);

    return () => clearTimeout(handler);
  }, [values.cndn]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDebitAmount(values.debitAmount);
    }, 400);
    return () => clearTimeout(handler);
  }, [values.debitAmount]);

  useEffect(() => {
    if (debouncedDebitAmount != 0 && debouncedDebitAmount) {
      setValues((prev) => ({
        ...prev,
        commitedAmount: prev.commitedAmount - debouncedDebitAmount,
      }));
    } else {
      const units = getActiveUnits(values, selectedCourse);
      const billingAmount = units * (values.billingRate || 0);
      if (!discount) {
        setValues((prev) => ({
          ...prev,
          commitedAmount: billingAmount,
        }));
      } else {
        setValues((prev) => ({
          ...prev,
          commitedAmount: billingAmount - prev.discountedAmount,
        }));
      }
    }
  }, [debouncedDebitAmount]);

  useEffect(() => {
    const loadInit = async () => {
      try {
        const [mRes, aRes]: [Response<Member>, Response<Activity>] | any =
          await Promise.all([getMembers(), getActivities({ limit: 100 })]);

        setMembers(mRes?.data || []);
        setActivity(aRes?.data || []);

        try {
          const allRes: Response<Academy> | any = await getAcademies({
            limit: 1000,
          });
          setAllAcademies(allRes?.data || []);
        } catch {
          console.error("Failed to load all academies for debit note");
        }
      } catch {
        setError("Failed to load members or activities.");
      }
    };
    loadInit();
  }, []);

  useEffect(() => {
    setValues((prev) => ({
      ...prev,
      memberName: memberName,
    }));
  }, [memberName]);

  useEffect(() => {
    if (!values?.activityName) return;
    if (!selectedActivity) return;

    const loadAcademies = async () => {
      try {
        const res: Response<Academy> | any = await getAcademies({
          search: selectedActivity,
        });
        setAcademy(res?.data || []);
      } catch {
        setError("Failed to load academies.");
      }
    };

    loadAcademies();
  }, [values?.activityName, selectedActivity]);

  useEffect(() => {
    if (!values?.academyId) return;

    const loadCourses = async () => {
      try {
        const res: Response<Course> | any = await getCourses({
          academyId: Number(values.academyId),
        });
        setCourse(res?.data || []);
      } catch {
        setError("Failed to load courses.");
      }
    };

    loadCourses();
  }, [values?.academyId]);

  useEffect(() => {
    if (!values?.courseId) return;

    const foundCourse = course.find(
      (c) => Number(c.courseId) === Number(values?.courseId)
    );

    if (foundCourse) {
      setSelectedCourse(foundCourse);

      const sessionCharging = isCourseChargingBySession(foundCourse);

      const initialUnits = Number(foundCourse.minEnrollmentUnit ?? 0);
      const unitRate = Number(foundCourse.unitRate ?? 0);

      const { amount, adjust } = AdjustBillingAmount(initialUnits * unitRate);

      setValues((prev) => ({
        ...prev,
        numberOfDays: sessionCharging ? prev.numberOfDays : initialUnits,
        sessionUnits: sessionCharging ? initialUnits : prev.sessionUnits || 0,
        billingRate: unitRate,
        billingAmount: initialUnits * unitRate,
        commitedAmount: amount,
        discountedAmount: 0,
        adjustment: adjust,
      }));
    }

    const loadBatches = async () => {
      try {
        const courseIdNum = Number(values.courseId);
        if (!courseIdNum) {
          setBatches([]);
          return;
        }

        const res: Response<Batch[]> | any = await getBatch({
          courseId: courseIdNum,
        });

        const allBatches = res?.data || [];

        setBatches(allBatches);
      } catch (err) {
        console.error("Failed to load batches:", err);
        setError("Failed to load batches.");
      }
    };

    loadBatches();
    fetchDiscount(); // will use proper units inside
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values?.courseId, course]);

  // When discount toggled or discount object changes -> recalc committed using the active units
  useEffect(() => {
    if (values.isDiscounted) {
      const { amount, adjust } = AdjustBillingAmount(values.billingAmount);
      setValues((prev) => ({
        ...prev,
        discountId: 0,
        discountedAmount: 0,
        commitedAmount: amount,
        adjustment: adjust,
      }));

      return;
    }

    const units = getActiveUnits(values, selectedCourse);
    const totalBilling = units * (values.billingRate || 0);

    const discountedAmount =
      (totalBilling * (discount?.discountPercentage ?? 0)) / 100;
    const { amount, adjust } = AdjustBillingAmount(
      totalBilling - discountedAmount
    );
    setValues((prev) => ({
      ...prev,
      discountId: discount?.discountId ?? 0,
      discountedAmount: discountedAmount ?? 0.0,
      commitedAmount: amount,
      adjustment: adjust,
    }));
  }, [
    discount,
    values.isDiscounted,
    values.sessionUnits,
    values.numberOfDays,
    values.billingRate,
    selectedCourse,
  ]);

  useEffect(() => {
    fetchDiscount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDays, values.sessionUnits]);

  useEffect(() => {
    if (!debouncedCndn || debouncedCndn === 0) {
      if (!selectedCourse) return;

      // Use the appropriate units for original billing amount:
      const units = getActiveUnits(values, selectedCourse);
      const originalBillingAmount =
        units * (selectedCourse.unitRate ?? 0) - values.discountedAmount;

      const { amount, adjust } = AdjustBillingAmount(originalBillingAmount);
      setValues((prev) => ({
        ...prev,
        billingRate: selectedCourse.unitRate,
        commitedAmount: amount,
        adjustment: adjust,
      }));

      return;
    }

    if (!getActiveUnits(values, selectedCourse) || !debouncedCndn) return;

    // When CNDN present: compute effective billing rate per active unit
    if (!discount) {
      const unitRate = Number(selectedCourse?.unitRate ?? 0);
      const fp = Number(unitRate);
      const units = getActiveUnits(values, selectedCourse);
      // sp = cndn per total units -> convert to per-unit numeric effect
      const sp = Number((debouncedCndn / units).toFixed(2));
      const effectiveBillingRate = Number((fp - sp).toFixed(2));

      const { amount, adjust } = AdjustBillingAmount(
        effectiveBillingRate * units
      );
      setValues((prev) => ({
        ...prev,
        billingRate: effectiveBillingRate,
        billingAmount: (selectedCourse?.unitRate ?? 0) * units,
        commitedAmount: amount,
        adjustment: adjust,
      }));
    } else {
      const unitRate = Number(selectedCourse?.unitRate ?? 0);
      const percentage = Number(discount?.discountPercentage ?? 0);
      const fp = Number(((unitRate * percentage) / 100).toFixed(2));
      const units = getActiveUnits(values, selectedCourse);
      const sp = Number((debouncedCndn / units).toFixed(2));
      const effectiveBillingRate = Number((fp - sp).toFixed(2));

      const { amount, adjust } = AdjustBillingAmount(
        effectiveBillingRate * units
      );
      setValues((prev) => ({
        ...prev,
        billingRate: effectiveBillingRate,
        billingAmount: (selectedCourse?.unitRate ?? 0) * units,
        commitedAmount: amount,
        adjustment: adjust,
      }));
    }
  }, [
    debouncedCndn,
    values.sessionUnits,
    values.numberOfDays,
    selectedCourse,
    discount,
  ]);

  useEffect(() => {
    if (!debouncedCndn || debouncedCndn === 0) {
      setDebitNoteValues({
        debitNoteDate: format(Date.now(), "yyyy-MM-dd") as any,
        academyId: 0,
        debitNoteAcademyId: 0,
        debitNoteType: "",
        coachId: null,
        debitNoteAmount: 0,
        debitNoteRemarks: "",
      });
      setDebitNoteAcademyId(0);
      setCoaches([]);
      return;
    }

    const academyForDebit = debitNoteAcademyId || values.academyId;
    if (!academyForDebit) return;

    const fetchCoaches = async () => {
      try {
        const coachesRes: Response | any = await getAcademyCoaches({
          academyId: Number(academyForDebit),
        });
        setCoaches(coachesRes?.data || []);
      } catch {
        setError("Failed to load coaches for debit note academy.");
      }
    };

    fetchCoaches();
    setDebitNoteValues((prev) => ({
      ...prev,
      academyId: values.academyId,
      debitNoteAcademyId: academyForDebit,
      debitNoteAmount: debouncedCndn,
    }));
  }, [debouncedCndn, values.academyId, debitNoteAcademyId]);

  useEffect(() => {
    if (!values.startDate || !debouncedDays) return;

    const start = new Date(values.startDate);
    const end = new Date(start);

    end.setDate(start.getDate() + Number(debouncedDays));

    setValues((prev: any) => ({
      ...prev,
      endDate: format(end, "yyyy-MM-dd"),
    }));
  }, [values.startDate, debouncedDays]);

  useEffect(() => {
    const commited = Number(values.commitedAmount || 0);
    const paid = Number(paymentValues.paid || 0);
    const remaining = Number((commited - paid).toFixed(2));
    setPaymentValues((prev) => ({ ...prev, remaining }));
  }, [values.commitedAmount, paymentValues.paid]);

  const onChange = useCallback(
    (field: string, value: any) => {
      const numFields = [
        "academyId",
        "courseId",
        "batchId",
        "numberOfDays",
        "freeDays",
        "sessionUnits",
      ];

      if (numFields.includes(field)) {
        value = Number(value);
      }

      if (field === "activityName") {
        const data = activity.find((e) => e.activityId === Number(value));
        setSelectedActivity(data?.activityName || "");
      }

      if (field === "batchId") {
        // find the batch, check capacity
        const selectedBatch = batches.find(
          (b) => Number(b.batchId) === Number(value)
        );

        if (selectedBatch) {
          const isFull =
            Number(selectedBatch.activeMemberCount) >=
            Number(selectedBatch.batchCapacity);
          if (isFull) {
            setRequestBatchDetails({
              batchId: Number(selectedBatch.batchId),
              batchName: selectedBatch.batchName || "",
            });
            setShowBatchRequest(true);
            return;
          }
        }

        setValues((prev) => ({ ...prev, [field]: value }));
        onBatchSelect(Number(value));
        return;
      }

      if (field === "endDate") {
        const start = new Date(values.startDate);
        const end = new Date(value);

        let numberOfDays = 0;

        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          numberOfDays = Math.ceil(
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          );
        }

        setValues((prev) => ({
          ...prev,
          endDate: value,
          numberOfDays: numberOfDays > 0 ? numberOfDays : 0,
        }));
      }

      setValues((prev) => ({ ...prev, [field]: value }));

      if (field === "numberOfDays" || field === "sessionUnits") {
        const units =
          field === "numberOfDays"
            ? Number(value)
            : Number(values.numberOfDays);
        const sUnits =
          field === "sessionUnits"
            ? Number(value)
            : Number(values.sessionUnits);
        const activeUnits = isCourseChargingBySession(selectedCourse)
          ? sUnits
          : units;
        const billingAmount =
          activeUnits * (values.billingRate || selectedCourse?.unitRate || 0);
        const { amount, adjust } = AdjustBillingAmount(billingAmount);

        setValues((prev) => ({
          ...prev,
          billingAmount,
          commitedAmount: amount,
          adjustment: adjust,
        }));

        fetchDiscount(activeUnits);
      }
    },
    [
      activity,
      onBatchSelect,
      batches,
      selectedCourse,
      values.billingRate,
      values.numberOfDays,
      values.sessionUnits,
    ]
  );

  const onDebitNoteChange = (field: string, value: any) => {
    if (field === "debitNoteAcademyId" || field === "coachId")
      value = Number(value);

    if (field === "debitNoteAcademyId") {
      setDebitNoteAcademyId(Number(value));
    }

    setDebitNoteValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const onPaymentChange = (field: string, value: any) => {
    if (field === "paid") value = Number(value || 0);
    if (field === "remaining") value = Number(value || 0);

    if (field === "transactionId" && value === "") value = null;

    setPaymentValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const mustHaveTransaction =
        (paymentValues.paymentMode || "").toLowerCase() !== "cash";

      if (mustHaveTransaction && !paymentValues.transactionId) {
        setError("Transaction ID is required for non-cash payment modes.");
        return;
      }

      if (Number(paymentValues.paid) < 0) {
        setError("Paid amount cannot be negative.");
        return;
      }

      const committed = Number(values.commitedAmount || 0);
      const paidVal = Number(paymentValues.paid || 0);
      if (paidVal > committed) {
        setError("Paid amount cannot exceed committed amount.");
        return;
      }

      const payload: any = { ...values };

      if (debouncedCndn && Number(debitNoteValues.debitNoteAmount) > 0) {
        Object.assign(payload, {
          debitNoteAcademyId: debitNoteValues.debitNoteAcademyId,
          coachId: debitNoteValues.coachId ?? null,
          debitNoteType: debitNoteValues.debitNoteType ?? null,
          debitNoteAmount: Number(debitNoteValues.debitNoteAmount) || 0,
          debitNoteRemarks: debitNoteValues.debitNoteRemarks ?? null,
        });
      } else {
        Object.assign(payload, {
          debitNoteAcademyId: null,
          coachId: null,
          debitNoteType: null,
          debitNoteAmount: null,
          debitNoteRemarks: null,
        });
      }
      const paymentPayload = {
        paymentType: paymentValues.paymentType,
        paymentMode: paymentValues.paymentMode,
        transactionId:
          (paymentValues.paymentMode || "").toLowerCase() === "cash"
            ? null
            : paymentValues.transactionId ?? null,
        paid: Number(paymentValues.paid || 0),
        remaining: Number(paymentValues.remaining || 0),
        paymentRemarks: paymentValues.paymentRemarks ?? null,
      };

      Object.assign(payload, paymentPayload);

      const res: Response<Enrollment> = await createEnrollment(payload as any);
      if (res.success) {
        toast({
          title: "Success",
          description: "successfully enrollment",
          variant: "success",
        });
        navigate("/enrollment");
      } else {
        setError("Failed to create enrollment.");
      }
    } catch (err) {
      console.error("create enrollment error", err);
      setError("Failed to make enrollment.");
    }
  };

  const onClose = () => {
    setValues({} as any);
  };

  const fetchDiscount = async (overrideUnits?: number) => {
    if (!values?.courseId) return;
    const units =
      typeof overrideUnits === "number"
        ? overrideUnits
        : getActiveUnits(values, selectedCourse);
    if (!units) return;
    try {
      const res: Response<Discount> | any = await getDiscounts({
        courseId: Number(values?.courseId),
        aboveUnits: Number(units),
        sortBy: "aboveUnits",
        sortOrder: "DESC",
        status: "active",
      });
      const data = res.data[0];
      const billingAmount =
        units * (values.billingRate || selectedCourse?.unitRate || 0);
      setValues((prev) => ({
        ...prev,
        discountId: data?.discountId || 0,
        billingAmount,
        commitedAmount: billingAmount,
      }));
      setDiscount(data);
    } catch {
      setError("Failed to load discount.");
    }
  };

  const fields = [
    {
      name: "memberName",
      label: "Member",
      required: true,
      disabled: true,
    },
    {
      name: "activityName",
      label: "Activity Name",
      type: "select",
      options: activity.map((e) => ({
        label: e.activityName,
        value: Number(e.activityId),
      })),
      required: true,
    },
    {
      name: "academyId",
      label: "Academy",
      type: "select",
      options: academy.map((e) => ({
        label: e.academyName,
        value: Number(e.academyId),
      })),
      required: true,
    },
    {
      name: "courseId",
      label: "Course",
      type: "select",
      options: course.map((e) => ({
        label: e.courseName,
        value: Number(e.courseId),
      })),
      required: true,
    },
    {
      name: "batchId",
      label: "Batch",
      type: "select",
      options: batches.map((b) => {
        const format = (t: string) => (t ? t.slice(0, 5) : "");

        const isFull = b.activeMemberCount >= b.batchCapacity;

        const label = `${b.batchName} | ${format(b.startTime)}-${format(
          b.endTime
        )} | Seats: ${b.activeMemberCount} / ${b.batchCapacity}`;

        return {
          label,
          value: Number(b.batchId),
          className: isFull ? "text-red-600" : "",
        };
      }),
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
    },
    {
      name: "endDate",
      label: "End Date",
      type: "date",
      required: false,
    },
    {
      name: "freeDays",
      label: "Free Days",
      type: "number",
      required: false,
      disabled: true,
    },
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
      disabled: true,
    },
    {
      name: "isDiscounted",
      label: "Do you want to remove applied discount?",
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
    {
      name: "billingAmount",
      label: "Billing Amount",
      type: "number",
      disabled: true,
    },
    {
      name: "billingRate",
      label: "Billing Rate",
      type: "number",
      disabled: true,
    },
    {
      name: "debitAmount",
      label: "Debit Amount",
      type: "number",
    },
    {
      name: "cndn",
      label: "CNDN",
      type: "number",
    },
    {
      name: "adjustment",
      label: "Adjustment",
      type: "number",
      disabled: true,
    },
    {
      name: "openEnrollment",
      label: "Open Enrollment",
      type: "checkbox",
    },
    {
      name: "remarks",
      label: "Remarks",
      type: "textarea",
    },
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
  ];

  const debitNoteFields = [
    {
      name: "debitNoteAcademyId",
      label: "Debit Note Academy",
      type: "select",
      options: allAcademies.map((a) => ({
        label: a.academyName,
        value: Number(a.academyId),
      })),
      required: false,
    },
    {
      name: "coachId",
      label: "Coach Name",
      type: "select",
      options: coaches.map((c) => ({
        label: `${c.coachFirstName} ${c.coachMiddleName ?? ""} ${
          c.coachLastName
        }`.trim(),
        value: c.coachId,
      })),
    },
    {
      name: "debitNoteType",
      label: "Type",
      type: "text",
      required: true,
    },
    {
      name: "debitNoteAmount",
      label: "Amount",
      type: "text",
      required: true,
      disabled: true,
    },
    {
      name: "debitNoteRemarks",
      label: "Remarks",
      type: "textarea",
      required: true,
    },
  ];

  const paymentFields = [
    {
      name: "paymentType",
      label: "Payment Type",
      type: "text",
      required: true,
      disabled: true,
    },
    {
      name: "paymentMode",
      label: "Payment Mode",
      type: "select",
      options: [
        { label: "Cash", value: "cash" },
        { label: "Card", value: "card" },
        { label: "UPI", value: "upi" },
        { label: "Bank", value: "bank" },
      ],
      required: true,
    },
    ...(paymentValues.paymentMode !== "cash"
      ? [
          {
            name: "transactionId",
            label: "Transaction ID",
            type: "text",
            required: true,
            disabled: false,
          },
        ]
      : []),
    {
      name: "paid",
      label: "Paid",
      type: "number",
      required: true,
    },
    {
      name: "remaining",
      label: "Remaining",
      type: "number",
      required: true,
      disabled: true,
    },
    {
      name: "paymentRemarks",
      label: "Payment Remarks",
      type: "textarea",
      required: false,
    },
  ];

  return (
    <div className="flex flex-col max-h-[90vh] overflow-hidden">
      <div className="overflow-auto">
        {memberName && (
          <>
            <h1 className="text-center text-blue-600 font-bold text-2xl py-2">
              Enrollment Details
            </h1>
            <FormContent
              fields={fields as any}
              values={values as any}
              errors={{}}
              loading={false}
              error={error}
              isSubmitting={false}
              onChange={onChange as any}
              layout="grid"
            />

            <h1 className="text-center text-blue-600 font-bold text-2xl py-2">
              Payment
            </h1>
            <FormContent
              fields={paymentFields as any}
              values={paymentValues as any}
              errors={{}}
              loading={false}
              error={error}
              isSubmitting={false}
              onChange={(name: string | number, val: any) => {
                onPaymentChange(name, val);
              }}
              layout="grid"
            />

            {debouncedDebitAmount != 0 && debouncedDebitAmount != null && (
              <>
                <h1 className="text-center text-blue-600 font-bold text-2xl py-2">
                  Debit Note
                </h1>
                <FormContent
                  fields={debitNoteFields as any}
                  values={debitNoteValues as any}
                  errors={{}}
                  loading={false}
                  error={error}
                  isSubmitting={false}
                  onChange={onDebitNoteChange as any}
                  layout="grid"
                />
              </>
            )}
          </>
        )}
      </div>
      <FormFooter
        onClose={onClose}
        onSubmit={handleSubmit}
        submitLabel="Create"
        isSubmitting={false}
      />

      <BatchRequestedForm
        isOpen={showBatchRequest}
        onClose={() => setShowBatchRequest(false)}
        batchId={requestBatchDetails?.batchId || 0}
        batchName={requestBatchDetails?.batchName || ""}
        enrollment={values as Enrollment}
        onSuccess={() => {
          setShowBatchRequest(false);
          toast({
            title: "Requested",
            description: "Spot request submitted.",
            variant: "success",
          });
        }}
      />
    </div>
  );
};

export default EnrollmentFormNew;
