import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, differenceInCalendarDays, parseISO, isDate } from "date-fns";

import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import { getEnrollmentById } from "@/api/enrollment.api";
import { getCourseById } from "@/api/course.api";
import { createPayment } from "@/api/payment.api";

import type { Response } from "@/types/response";
import type { Enrollment } from "@/types/enrollment";
import type { Course } from "@/types/course";

const RefundEnrollment = () => {
  const { id }: any = useParams();
  const navigate = useNavigate();

  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [oldEnrollment, setOldEnrollment] = useState<Enrollment | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

  const [values, setValues] = useState<any>({
    enrollmentId: Number(id),
    refundDate: format(new Date(), "yyyy-MM-dd"),
    processingCharge: 100, // keep as before; change if you want different default
    paymentMode: "cash", // user-selectable (was previously named paymentType by mistake)
    transactionId: "",
    remarks: "",
    // paymentType is fixed and will be "refund" when sent to backend
  });

  const [computed, setComputed] = useState({
    totalDays: 0,
    usedDays: 0,
    remainingDays: 0,
    fullDailyRate: 0,
    refundBeforeProcessing: 0,
    finalRefundAmount: 0,
    originalCommittedAmount: 0,
    originalDiscountApplied: 0,
  });

  function parseDateOnly(val?: string | Date | null) {
    if (!val) return null;
    if (isDate(val)) return val as Date;
    const s = String(val).slice(0, 10);
    try {
      return parseISO(s);
    } catch {
      return null;
    }
  }

  function calculateDays(startISO?: any, endISO?: any) {
    const start = parseDateOnly(startISO);
    const end = parseDateOnly(endISO);
    if (!start || !end) return 0;
    const diff = differenceInCalendarDays(end, start);
    return diff >= 0 ? diff + 1 : 0;
  }

  // fetch enrollment
  useEffect(() => {
    const fetchEnrollment = async () => {
      try {
        const res: Response<Enrollment | any> = await getEnrollmentById(id);
        const data = res?.data;
        if (!data) {
          setError("Enrollment not found");
          return;
        }
        setOldEnrollment(data);

        setValues((prev: any) => ({
          ...prev,
          enrollmentId: Number(id),
          memberId: data.memberId,
          startDate: data.startDate,
          endDate: data.endDate,
          commitedAmount: data.commitedAmount ?? 0,
          billingAmount: data.billingAmount ?? 0,
          billingRate: data.billingRate ?? 0,
          originalNumberOfDays: data.numberOfDays ?? 0,
          originalFreeDays: data.freeDays ?? 0,
        }));
      } catch (err) {
        console.error("fetch enrollment error", err);
        setError("Failed to fetch enrollment");
      }
    };

    if (id) fetchEnrollment();
  }, [id]);

  // fetch course (to get full unit rate)
  useEffect(() => {
    const fetchCourse = async () => {
      if (!oldEnrollment?.courseId) return;
      try {
        const res: Response<Course | any> = await getCourseById(
          Number(oldEnrollment.courseId)
        );
        const c = res?.data;
        if (!c) return;
        setCourse(c);
      } catch (err) {
        console.error("fetch course error", err);
        setError("Failed to fetch course data");
      }
    };
    fetchCourse();
  }, [oldEnrollment?.courseId]);

  // compute derived values
  useEffect(() => {
    if (!oldEnrollment || !course) return;

    const totalDays =
      Number(oldEnrollment.numberOfDays ?? 0) +
      Number(oldEnrollment.freeDays ?? 0);
    const refundDate = values.refundDate || format(new Date(), "yyyy-MM-dd");
    const usedDays = calculateDays(oldEnrollment.startDate, refundDate);
    const remainingDays = Math.max(0, totalDays - usedDays);
    const fullDailyRate = Number(course.unitRate ?? 0);
    const refundBeforeProcessing = Number(
      (remainingDays * fullDailyRate).toFixed(2)
    );
    const fullTotalAtFullRate = totalDays * fullDailyRate;
    const originalCommittedAmount = Number(
      oldEnrollment.commitedAmount ?? oldEnrollment.billingAmount ?? 0
    );
    const discountApplied = Math.max(
      0,
      fullTotalAtFullRate - originalCommittedAmount
    );
    const processingCharge = Number(values.processingCharge ?? 0);
    const finalRefundAmount = Math.max(
      0,
      refundBeforeProcessing - processingCharge
    );

    setComputed({
      totalDays,
      usedDays,
      remainingDays,
      fullDailyRate,
      refundBeforeProcessing,
      finalRefundAmount,
      originalCommittedAmount,
      originalDiscountApplied: discountApplied,
    });

    setValues((prev: any) => ({
      ...prev,
      totalDays,
      usedDays,
      remainingDays,
      fullDailyRate,
      refundBeforeProcessing,
      finalRefundAmount,
      originalCommittedAmount,
      originalDiscountApplied: discountApplied,
    }));
  }, [oldEnrollment, course, values.refundDate, values.processingCharge]);

  const onChange = (field: string, value: any) => {
    // numerical conversion for processingCharge
    if (field === "processingCharge") value = Number(value || 0);
    setValues((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const refundAmount = Number(computed.finalRefundAmount ?? 0);

      if (refundAmount <= 0) {
        setError("Refund amount must be greater than 0.");
        setIsSubmitting(false);
        return;
      }

      // Build payment payload with swapped semantics fixed:
      // - paymentType is the action (refund)
      // - paymentMode is how the payment was/ will be made (cash/bank/upi/etc)
      const paymentPayload: any = {
        paymentType: "refund", // fixed — we swapped this back
        enrollmentId: Number(values.enrollmentId) || null,
        paymentMode: values.paymentMode || "cash", // user-selectable (was previously misnamed)
        transactionId:
          values.paymentMode && values.paymentMode !== "cash"
            ? values.transactionId || null
            : null,
        totalAmount: refundAmount,
        paid: refundAmount,
        remaining: 0,
        paymentRemarks: values.remarks || null,
        academyName: oldEnrollment?.academyName || null,
        courseName: oldEnrollment?.courseName || null,
        memberName: (oldEnrollment as any)?.memberName || null,
      };

      await createPayment(paymentPayload);
      navigate("/enrollment");
    } catch (err) {
      console.error("create payment error", err);
      setError("Failed to create refund payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only the editable fields you requested
  const fields = [
    {
      name: "processingCharge",
      label: "Processing Charge (to deduct)",
      type: "number",
      value: values.processingCharge,
    },
    {
      name: "paymentMode",
      label: "Payment Mode", // user selects mode (cash, bank, upi...) — swapped corrected
      type: "select",
      required: true,
      options: [
        { label: "Cash", value: "cash" },
        { label: "Bank Transfer", value: "bank" },
        { label: "UPI", value: "upi" },
        { label: "Other", value: "other" },
      ],
      value: values.paymentMode,
    },
    {
      name: "transactionId",
      label: "Transaction ID (if non-cash)",
      type: "text",
      required: values.paymentMode !== "cash",
      value: values.transactionId,
    },
    {
      name: "remarks",
      label: "Remarks",
      type: "textarea",
      value: values.remarks,
    },
  ];

  return (
    <div className="flex flex-col max-h-[90vh] overflow-hidden">
      <div className="overflow-auto">
        <FormContent
          fields={fields as any}
          values={values as any}
          errors={{}}
          loading={false}
          error={error}
          isSubmitting={isSubmitting}
          onChange={onChange as any}
          layout="grid"
        />

        {/* Summary: show read-only enrollment/payment computation data */}
        <div className="p-4 mt-4 bg-gray-50 rounded-md">
          <div className="text-sm text-slate-700 space-y-1">
            <div>
              <strong>Enrollment:</strong>{" "}
              {oldEnrollment ? `#${oldEnrollment.enrollmentId}` : "—"}
            </div>
            <div>Enrollment Date: {oldEnrollment?.enrollmentDate || "—"}</div>
            <div>Start Date: {oldEnrollment?.startDate || "—"}</div>
            <div>End Date: {oldEnrollment?.endDate || "—"}</div>
            <div>
              Original committed amount: ₹{computed.originalCommittedAmount}
            </div>
            <div>
              Original discount applied (if any): ₹
              {computed.originalDiscountApplied}
            </div>
            <div>Total days: {computed.totalDays}</div>
            <div>Used days: {computed.usedDays}</div>
            <div>Remaining days: {computed.remainingDays}</div>
            <div>
              Refund before processing: ₹{computed.refundBeforeProcessing}
            </div>
            <div>
              Processing charge (entered): ₹
              {Number(values.processingCharge ?? 0).toFixed(2)}
            </div>
            <div className="font-semibold mt-2">
              Final refund: ₹{computed.finalRefundAmount}
            </div>

            <div className="mt-2">
              <div className="text-xs text-slate-500">
                Payment details (will be recorded)
              </div>
              <div>Payment Type: refund</div>
              <div>Payment Mode: {values.paymentMode}</div>
              {values.paymentMode !== "cash" && (
                <div>Transaction ID: {values.transactionId || "—"}</div>
              )}
              <div>Remarks: {values.remarks || "—"}</div>
            </div>
          </div>
        </div>
      </div>

      <FormFooter
        onClose={() => navigate("/enrollment")}
        onSubmit={handleSubmit}
        submitLabel="Create Refund Payment"
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default RefundEnrollment;
