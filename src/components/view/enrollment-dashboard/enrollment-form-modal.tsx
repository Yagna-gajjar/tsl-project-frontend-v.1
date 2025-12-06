import { useEffect, useState } from "react";

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

const EnrollmentFormNew = ({
  memberId,
  memberName,
}: {
  memberId: number;
  memberName: string;
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

  const [values, setValues] = useState<Enrollment>({
    memberId: Number(memberId),
    memberName: memberName ?? "Not Selected",
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

  const [debouncedDays, setDebouncedDays] = useState(values.numberOfDays);
  const [debouncedCndn, setDebouncedCndn] = useState(values.cndn);

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

  // -------------------------
  // Payment state (new)
  // -------------------------
  const [paymentValues, setPaymentValues] = useState({
    paymentType: "Reciept", // default
    paymentMode: "cash", // cash | card | upi | bank etc.
    transactionId: "" as string | null,
    paid: 0,
    remaining: 0, // computed: commitedAmount - paid (disabled)
    paymentRemarks: "" as string | null,
  });

  const navigate = useNavigate();

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
    const loadInit = async () => {
      try {
        const [mRes, aRes]: [Response<Member>, Response<Activity>] | any =
          await Promise.all([getMembers(), getActivities({ limit: 100 })]);

        setMembers(mRes?.data || []);
        setActivity(aRes?.data || []);

        // fetch ALL academies for the debit-note dropdown (no activity filter)
        try {
          const allRes: Response<Academy> | any = await getAcademies({
            limit: 1000, // adjust as needed
          });
          setAllAcademies(allRes?.data || []);
        } catch {
          // don't block main init if all academies fail; just log error
          // eslint-disable-next-line no-console
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

  // fix: ensure safe handling when course isn't found and always fetch batches when courseId exists
  useEffect(() => {
    if (!values?.courseId) return;

    // try to find course locally (may be undefined if course list not loaded yet)
    const foundCourse = course.find(
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

    const loadBatches = async () => {
      try {
        // ensure we pass a number
        const courseIdNum = Number(values.courseId);
        if (!courseIdNum) {
          setBatches([]);
          return;
        }

        const res: Response<Batch[]> | any = await getBatch({
          courseId: courseIdNum,
        });

        const allBatches = res?.data || [];

        // Keep only batches where activeMemberCount / batchCapacity < 1
        const filtered = allBatches.filter((batch) => {
          const count = Number(batch.activeMemberCount) || 0;
          const capacity = Number(batch.batchCapacity) || 0;

          // If capacity is 0 treat as unavailable
          if (capacity === 0) return false;

          return count / capacity < 1;
        });

        setBatches(filtered);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load batches:", err);
        setError("Failed to load batches.");
      }
    };

    loadBatches();
    fetchDiscount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values?.courseId]);

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

    const discountedAmount =
      (values.billingAmount * (discount?.discountPercentage ?? 0)) / 100;
    const { amount, adjust } = AdjustBillingAmount(
      values.billingAmount - discountedAmount
    );
    setValues((prev) => ({
      ...prev,
      discountId: discount?.discountId ?? 0,
      discountedAmount: discountedAmount ?? 0.0,
      commitedAmount: amount,
      adjustment: adjust,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discount, values.isDiscounted]);

  useEffect(() => {
    fetchDiscount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDays]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedCndn]);

  // NEW: fetch coaches based on debitNoteAcademyId OR fallback to enrollment academyId.
  // Also clear debit note values & coaches if cndn removed (0/null).
  useEffect(() => {
    // If cndn is not present (0 or null), clear debit note values and coaches
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

    // choose which academy to fetch coaches for:
    // priority: explicitly selected debitNoteAcademyId > enrollment academyId
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

    // fetch coaches and update debit note amounts/academy
    fetchCoaches();
    setDebitNoteValues((prev) => ({
      ...prev,
      academyId: values.academyId,
      debitNoteAcademyId: academyForDebit,
      debitNoteAmount: debouncedCndn,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Recompute payment.remaining whenever commitedAmount or payment.paid changes
  useEffect(() => {
    const commited = Number(values.commitedAmount || 0);
    const paid = Number(paymentValues.paid || 0);
    const remaining = Number((commited - paid).toFixed(2));
    setPaymentValues((prev) => ({ ...prev, remaining }));
  }, [values.commitedAmount, paymentValues.paid]);

  const AdjustBillingAmount = (amount: number) => {
    const roundedAmount = Math.ceil(amount);
    const newAdjust = roundedAmount - amount;

    return {
      amount: Number(roundedAmount.toFixed(2)),
      adjust: Number(newAdjust.toFixed(2)),
    };
  };

  const onChange = (field: string, value: any) => {
    const numFields = [
      "academyId",
      "memberId",
      "courseId",
      "batchId",
      "numberOfDays",
      "freeDays",
    ];

    if (numFields.includes(field)) {
      value = Number(value);
    }

    if (field === "activityName") {
      const data = activity.find((e) => e.activityId === Number(value));
      setSelectedActivity(data?.activityName || "");
    }

    setValues((prev) => ({ ...prev, [field]: value }));
  };

  // updated: account for debitNoteAcademyId and numeric conversions
  const onDebitNoteChange = (field: string, value: any) => {
    // numeric conversions
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

  // -------------------------
  // Payment handlers (new)
  // -------------------------
  const onPaymentChange = (field: string, value: any) => {
    // convert numeric for 'paid'
    if (field === "paid") value = Number(value || 0);
    if (field === "remaining") value = Number(value || 0);

    // normalize transactionId empty string to null for payload if needed
    if (field === "transactionId" && value === "") value = null;

    setPaymentValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      // Basic validation for payment fields
      const mustHaveTransaction =
        (paymentValues.paymentMode || "").toLowerCase() !== "cash";

      if (mustHaveTransaction && !paymentValues.transactionId) {
        setError("Transaction ID is required for non-cash payment modes.");
        return;
      }

      // paid must not be negative and should be <= commitedAmount
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

      // Build payload
      const payload: any = { ...values };

      // Only attach debit note fields when cndn / amount > 0; otherwise send explicit nulls
      if (debouncedCndn && Number(debitNoteValues.debitNoteAmount) > 0) {
        Object.assign(payload, {
          debitNoteAcademyId: debitNoteValues.debitNoteAcademyId,
          coachId: debitNoteValues.coachId ?? null,
          debitNoteType: debitNoteValues.debitNoteType ?? null,
          debitNoteAmount: Number(debitNoteValues.debitNoteAmount) || 0,
          debitNoteRemarks: debitNoteValues.debitNoteRemarks ?? null,
        });
      } else {
        // clear debit-note fields explicitly (or omit entirely if you prefer)
        Object.assign(payload, {
          debitNoteAcademyId: null,
          coachId: null,
          debitNoteType: null,
          debitNoteAmount: null,
          debitNoteRemarks: null,
        });
      }
      // Attach payment object — send only relevant fields per your requirement
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

      // Attach as 'payment' so backend receives it (you had commented this previously).
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
      // eslint-disable-next-line no-console
      console.error("create enrollment error", err);
      setError("Failed to make enrollment.");
    }
  };

  const onClose = () => {
    setValues({} as any);
  };

  const fetchDiscount = async () => {
    if (!values?.courseId) return;
    if (!values?.numberOfDays) return;
    try {
      const res: Response<Discount> | any = await getDiscounts({
        courseId: Number(values?.courseId),
        aboveUnits: Number(values?.numberOfDays),
        sortBy: "aboveUnits",
        sortOrder: "DESC",
        status: "active",
      });
      const data = res.data[0];
      setValues((prev) => ({
        ...prev,
        discountId: data?.discountId || 0,
        billingAmount: values?.numberOfDays * values?.billingRate,
        commitedAmount: values?.numberOfDays * values?.billingRate,
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
        const label = `${b.batchName}  |  ${format(b.startTime)}-${format(
          b.endTime
        )}  |  Seats: ${b.activeMemberCount} / ${b.batchCapacity}`;

        return {
          label,
          value: Number(b.batchId),
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
      // use ALL academies here so coaches can be filtered across every academy
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
            required: true, // now required
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
      disabled: true, // computed
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

            {/* Payment section (NEW) */}
            <h1 className="text-center text-blue-600 font-bold text-2xl py-2">
              Payment
            </h1>
            <FormContent
              fields={paymentFields as any}
              // Merge values so FormContent can pick each field from paymentValues
              values={paymentValues as any}
              errors={{}}
              loading={false}
              error={error}
              isSubmitting={false}
              // FormContent's onChange receives (name, value) — we route to onPaymentChange
              onChange={(name: string, val: any) => {
                // special handling: if paid changes, onPaymentChange will recompute remaining via the effect
                onPaymentChange(name, val);
              }}
              layout="grid"
            />

            {debouncedCndn != 0 && debouncedCndn != null && (
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
    </div>
  );
};

export default EnrollmentFormNew;