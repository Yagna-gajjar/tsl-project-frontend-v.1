import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

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
import type { DebitNote } from "@/types/debitNote";
import type { Coach } from "@/types/coach";

import { getMembers } from "@/api/member.api";
import { getActivities } from "@/api/activity.api";
import { getAcademies } from "@/api/academy.api";
import { getCourses } from "@/api/course.api";
import { getBatch } from "@/api/batch.api";
import { getAcademyCoaches } from "@/api/academyCoach.api";
import { getDiscounts } from "@/api/discount.api";
import { createEnrollment } from "@/api/enrollment.api";

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const toNumber = (v: unknown) =>
  v === "" || v === null || v === undefined ? 0 : Number(v);

function useEnrollmentForm(
  initialMemberId: number,
  initialMemberName: string | null,
  onBatchSelect: (id: number) => void
) {
  const navigate = useNavigate();

  const [error, setError] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [activityList, setActivityList] = useState<Activity[]>([]);
  const [academyList, setAcademyList] = useState<Academy[]>([]);
  const [allAcademies, setAllAcademies] = useState<Academy[]>([]);
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [discount, setDiscount] = useState<Discount | undefined>(undefined);
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<Course | undefined>(
    undefined
  );
  const [coaches, setCoaches] = useState<Coach[]>([]);

  const [values, setValues] = useState<Enrollment>({
    memberId: Number(initialMemberId),
    memberName: initialMemberName ?? "Not Selected",
    academyId: 0,
    adjustment: 0,
    batchId: 0,
    billingAmount: 0,
    billingRate: 0,
    cndn: 0,
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
  });

  const debouncedDays = useDebounced(values.numberOfDays);
  const debouncedCndn = useDebounced(values.cndn);

  const [debitNoteAcademyId, setDebitNoteAcademyId] = useState<number>(0);
  const [debitNoteValues, setDebitNoteValues] = useState<
    DebitNote & { debitNoteAcademyId?: number }
  >({
    debitNoteDate: format(Date.now(), "yyyy-MM-dd") as any,
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
    paymentRemarks: "" as string | null,
  });

  const paymentRemaining = useMemo(() => {
    const committed = Number(values.commitedAmount || 0);
    const paid = Number(paymentValues.paid || 0);
    return Number((committed - paid).toFixed(2));
  }, [values.commitedAmount, paymentValues.paid]);

  useEffect(() => {
    let mounted = true;
    const loadInit = async () => {
      try {
        const [mRes, aRes]: [Response<Member>, Response<Activity>] | any =
          await Promise.all([getMembers(), getActivities({ limit: 100 })]);
        if (!mounted) return;
        setMembers(mRes?.data || []);
        setActivityList(aRes?.data || []);

        try {
          const allRes: Response<Academy> | any = await getAcademies({
            limit: 1000,
          });
          if (!mounted) return;
          setAllAcademies(allRes?.data || []);
        } catch (err) {
          console.error("Failed to load all academies for debit note", err);
        }
      } catch (err) {
        if (!mounted) return;
        setError("Failed to load members or activities.");
      }
    };
    loadInit();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedActivity) return;
    let mounted = true;
    const loadAcademies = async () => {
      try {
        const res: Response<Academy> | any = await getAcademies({
          search: selectedActivity,
        });
        if (!mounted) return;
        setAcademyList(res?.data || []);
      } catch (err) {
        if (!mounted) return;
        setError("Failed to load academies.");
      }
    };
    loadAcademies();
    return () => {
      mounted = false;
    };
  }, [selectedActivity]);

  useEffect(() => {
    if (!values?.academyId) return;
    let mounted = true;
    const loadCourses = async () => {
      try {
        const res: Response<Course> | any = await getCourses({
          academyId: Number(values.academyId),
        });
        if (!mounted) return;
        setCourseList(res?.data || []);
      } catch (err) {
        if (!mounted) return;
        setError("Failed to load courses.");
      }
    };
    loadCourses();
    return () => {
      mounted = false;
    };
  }, [values.academyId]);

  useEffect(() => {
    if (!values?.courseId) return;
    let mounted = true;

    const foundCourse = courseList.find(
      (c) => Number(c.courseId) === Number(values?.courseId)
    );
    if (foundCourse) {
      setSelectedCourse(foundCourse);
      const { amount, adjust } = AdjustBillingAmount(
        foundCourse.minEnrollmentUnit * foundCourse.unitRate
      );
      setValues((prev) => ({
        ...prev,
        numberOfDays: foundCourse.minEnrollmentUnit,
        billingRate: foundCourse.unitRate,
        billingAmount: foundCourse.minEnrollmentUnit * foundCourse.unitRate,
        commitedAmount: amount,
        discountedAmount: 0,
        adjustment: adjust,
      }));
    }

    const load = async () => {
      try {
        const courseIdNum = Number(values.courseId);
        if (!courseIdNum) {
          setBatches([]);
          return;
        }
        const res: Response<Batch[]> | any = await getBatch({
          courseId: courseIdNum,
        });
        if (!mounted) return;
        const allBatches = res?.data || [];
        const filtered = allBatches.filter((batch) => {
          const count = Number(batch.activeMemberCount) || 0;
          const capacity = Number(batch.batchCapacity) || 0;
          if (capacity === 0) return false;
          return count / capacity < 1;
        });
        setBatches(filtered);
        try {
          const dRes: Response<Discount> | any = await getDiscounts({
            courseId: Number(values?.courseId),
            aboveUnits: Number(values?.numberOfDays),
            sortBy: "aboveUnits",
            sortOrder: "DESC",
            status: "active",
          });
          const data = dRes.data?.[0];
          if (!mounted) return;
          setValues((prev) => ({
            ...prev,
            discountId: data?.discountId || 0,
            billingAmount: values?.numberOfDays * values?.billingRate,
            commitedAmount: values?.numberOfDays * values?.billingRate,
          }));
          setDiscount(data);
        } catch (err) {
          console.error("Failed to load discount", err);
          if (!mounted) return;
          setError("Failed to load discount.");
        }
      } catch (err) {
        console.error("Failed to load batches:", err);
        if (!mounted) return;
        setError("Failed to load batches.");
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [values?.courseId]);

  useEffect(() => {
    if (!debouncedCndn || debouncedCndn === 0) {
      if (!selectedCourse) return;
      const originalBillingAmount =
        values?.numberOfDays * selectedCourse.unitRate -
        values.discountedAmount;
      const { amount, adjust } = AdjustBillingAmount(originalBillingAmount);
      setValues((prev) => ({
        ...prev,
        billingRate: selectedCourse.unitRate,
        commitedAmount: amount,
        adjustment: adjust,
      }));
      return;
    }

    if (!values.numberOfDays || !debouncedCndn) return;

    if (!discount) {
      const unitRate = Number(selectedCourse?.unitRate ?? 0);
      const fp = Number(unitRate);
      const sp = Number((debouncedCndn / values.numberOfDays).toFixed(2));
      const effectiveBillingRate = Number((fp - sp).toFixed(2));
      const { amount, adjust } = AdjustBillingAmount(
        effectiveBillingRate * values?.numberOfDays
      );
      setValues((prev) => ({
        ...prev,
        billingRate: effectiveBillingRate,
        billingAmount: (selectedCourse?.unitRate ?? 0) * values?.numberOfDays,
        commitedAmount: amount,
        adjustment: adjust,
      }));
    } else {
      const unitRate = Number(selectedCourse?.unitRate ?? 0);
      const percentage = Number(discount?.discountPercentage ?? 0);
      const fp = Number(((unitRate * percentage) / 100).toFixed(2));
      const sp = Number((debouncedCndn / values.numberOfDays).toFixed(2));
      const effectiveBillingRate = Number((fp - sp).toFixed(2));
      const { amount, adjust } = AdjustBillingAmount(
        effectiveBillingRate * values?.numberOfDays
      );
      setValues((prev) => ({
        ...prev,
        billingRate: effectiveBillingRate,
        billingAmount: (selectedCourse?.unitRate ?? 0) * values?.numberOfDays,
        commitedAmount: amount,
        adjustment: adjust,
      }));
    }
  }, [debouncedCndn]);

  useEffect(() => {
    if (!debouncedCndn || debouncedCndn === 0) {
      setDebitNoteValues((prev) => ({
        ...prev,
        debitNoteDate: format(Date.now(), "yyyy-MM-dd") as any,
        academyId: 0,
        debitNoteAcademyId: 0,
        debitNoteType: "",
        coachId: null,
        debitNoteAmount: 0,
        debitNoteRemarks: "",
      }));
      setDebitNoteAcademyId(0);
      setCoaches([]);
      return;
    }

    const academyForDebit = debitNoteAcademyId || values.academyId;
    if (!academyForDebit) return;
    let mounted = true;
    const fetchCoaches = async () => {
      try {
        const coachesRes: Response | any = await getAcademyCoaches({
          academyId: Number(academyForDebit),
        });
        if (!mounted) return;
        setCoaches(coachesRes?.data || []);
      } catch (err) {
        if (!mounted) return;
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
    return () => {
      mounted = false;
    };
  }, [debouncedCndn, values.academyId, debitNoteAcademyId]);

  useEffect(() => {
    if (!values.startDate || !debouncedDays) return;
    const start = new Date(values.startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + Number(debouncedDays));
    setValues((prev: any) => ({ ...prev, endDate: format(end, "yyyy-MM-dd") }));
  }, [values.startDate, debouncedDays]);

  const AdjustBillingAmount = useCallback((amount: number) => {
    const roundedAmount = Math.ceil(amount);
    const newAdjust = roundedAmount - amount;
    return {
      amount: Number(roundedAmount.toFixed(2)),
      adjust: Number(newAdjust.toFixed(2)),
    };
  }, []);

  const onChange = useCallback(
    (field: string, value: any) => {
      const numFields = [
        "academyId",
        "memberId",
        "courseId",
        "batchId",
        "numberOfDays",
        "freeDays",
      ];

      if (numFields.includes(field)) value = toNumber(value);

      if (field === "activityName") {
        const data = activityList.find((e) => e.activityId === Number(value));
        setSelectedActivity(data?.activityName || "");
      }

      if (field === "batchId") {
        setValues((prev) => ({ ...prev, [field]: value }));
        console.log(value);

        onBatchSelect(Number(value));
        return;
      }

      setValues((prev) => ({ ...prev, [field]: value }));
    },
    [activityList, onBatchSelect]
  );

  const onDebitNoteChange = useCallback((field: string, value: any) => {
    if (field === "debitNoteAcademyId" || field === "coachId")
      value = toNumber(value);
    if (field === "debitNoteAcademyId") setDebitNoteAcademyId(Number(value));
    setDebitNoteValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const onPaymentChange = useCallback((field: string, value: any) => {
    if (field === "paid") value = toNumber(value);
    if (field === "remaining") value = toNumber(value);
    if (field === "transactionId" && value === "") value = null;
    setPaymentValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      setError("");
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
        remaining: paymentRemaining,
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
  }, [
    values,
    paymentValues,
    debitNoteValues,
    debouncedCndn,
    paymentRemaining,
    navigate,
  ]);

  const onClose = useCallback(() => {
    setValues({} as any);
  }, []);

  return {
    // data
    error,
    members,
    activityList,
    academyList,
    allAcademies,
    courseList,
    batches,
    coaches,
    discount,
    selectedActivity,
    selectedCourse,

    // state
    values,
    debitNoteValues,
    paymentValues,
    paymentRemaining,

    // handlers
    onChange,
    onDebitNoteChange,
    onPaymentChange,
    handleSubmit,
    onClose,

    // setters (if parent wants direct control)
    setValues,
    setDebitNoteValues,
    setPaymentValues,
    setSelectedActivity,
  } as const;
}

const EnrollmentFormNew: React.FC<{
  memberId: number;
  memberName: string | null;
  onBatchSelect: (batch: Batch | null) => void;
}> = ({ memberId, memberName, onBatchSelect }) => {
  const form = useEnrollmentForm(memberId, memberName, onBatchSelect);

  const fields = useMemo(
    () => [
      { name: "memberName", label: "Member", required: true, disabled: true },
      {
        name: "activityName",
        label: "Activity Name",
        type: "select",
        options: form.activityList.map((e) => ({
          label: e.activityName,
          value: Number(e.activityId),
        })),
        required: true,
      },
      {
        name: "academyId",
        label: "Academy",
        type: "select",
        options: form.academyList.map((e) => ({
          label: e.academyName,
          value: Number(e.academyId),
        })),
        required: true,
      },
      {
        name: "courseId",
        label: "Course",
        type: "select",
        options: form.courseList.map((e) => ({
          label: e.courseName,
          value: Number(e.courseId),
        })),
        required: true,
      },
      {
        name: "batchId",
        label: "Batch",
        type: "select",
        options: form.batches.map((b) => {
          const fmt = (t: string) => (t ? t.slice(0, 5) : "");
          const label = `${b.batchName}  |  ${fmt(b.startTime)}-${fmt(
            b.endTime
          )}  |  Seats: ${b.activeMemberCount} / ${b.batchCapacity}`;
          return { label, value: Number(b.batchId) };
        }),
        required: true,
      },
      {
        name: "enrollmentDate",
        label: "Enrollment Date",
        type: "date",
        required: true,
      },
      { name: "startDate", label: "Start Date", type: "date", required: true },
      {
        name: "endDate",
        label: "End Date",
        type: "date",
        required: false,
        disabled: true,
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
      { name: "cndn", label: "CNDN", type: "number" },
      {
        name: "adjustment",
        label: "Adjustment",
        type: "number",
        disabled: true,
      },
      { name: "openEnrollment", label: "Open Enrollment", type: "checkbox" },
      { name: "remarks", label: "Remarks", type: "textarea" },
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
    ],
    [form.activityList, form.academyList, form.courseList, form.batches]
  );

  const debitNoteFields = useMemo(
    () => [
      {
        name: "debitNoteAcademyId",
        label: "Debit Note Academy",
        type: "select",
        options: form.allAcademies.map((a) => ({
          label: a.academyName,
          value: Number(a.academyId),
        })),
        required: false,
      },
      {
        name: "coachId",
        label: "Coach Name",
        type: "select",
        options: form.coaches.map((c) => ({
          label: `${c.coachFirstName} ${c.coachMiddleName ?? ""} ${
            c.coachLastName
          }`.trim(),
          value: c.coachId,
        })),
      },
      { name: "debitNoteType", label: "Type", type: "text", required: true },
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
    ],
    [form.allAcademies, form.coaches]
  );

  const paymentFields = useMemo(
    () => [
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
      ...(form.paymentValues.paymentMode !== "cash"
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
      { name: "paid", label: "Paid", type: "number", required: true },
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
    ],
    [form.paymentValues.paymentMode, form.paymentValues, form.paymentRemaining]
  );

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
              values={form.values as any}
              errors={{}}
              loading={false}
              error={form.error}
              isSubmitting={false}
              onChange={form.onChange as any}
              layout="grid"
            />

            <h1 className="text-center text-blue-600 font-bold text-2xl py-2">
              Payment
            </h1>
            <FormContent
              fields={paymentFields as any}
              values={
                {
                  ...form.paymentValues,
                  remaining: form.paymentRemaining,
                } as any
              }
              errors={{}}
              loading={false}
              error={form.error}
              isSubmitting={false}
              onChange={(name: string, val: any) =>
                form.onPaymentChange(name, val)
              }
              layout="grid"
            />

            {form.debitNoteValues.debitNoteAmount !== 0 &&
              form.debitNoteValues.debitNoteAmount != null && (
                <>
                  <h1 className="text-center text-blue-600 font-bold text-2xl py-2">
                    Debit Note
                  </h1>
                  <FormContent
                    fields={debitNoteFields as any}
                    values={form.debitNoteValues as any}
                    errors={{}}
                    loading={false}
                    error={form.error}
                    isSubmitting={false}
                    onChange={form.onDebitNoteChange as any}
                    layout="grid"
                  />
                </>
              )}
          </>
        )}
        <FormFooter
          onClose={form.onClose}
          onSubmit={form.handleSubmit}
          submitLabel="Create"
          isSubmitting={false}
        />
      </div>
    </div>
  );
};

export default EnrollmentFormNew;
