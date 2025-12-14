import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, differenceInCalendarDays, parseISO, isDate } from "date-fns";

import { motion } from "framer-motion";
import {
  DollarSign,
  Calendar,
  Wallet,
  FileText,
  CreditCard,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Hash,
  Calculator,
  Grid3X3,
  List,
  ArrowDown,
  type LucideIcon,
} from "lucide-react";

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
    processingCharge: 100,
    paymentMode: "cash",
    transactionId: "",
    remarks: "",
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

  useEffect(() => {
    const fetchCourse = async () => {
      if (!oldEnrollment?.courseId) return;
      try {
        const res: Response<Course> = await getCourseById(
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

  useEffect(() => {
    if (!oldEnrollment || !course) return;

    const totalDays =
      Number(oldEnrollment.numberOfDays ?? 0) +
      Number(oldEnrollment.freeDays ?? 0);
    const refundDate = values.refundDate || format(new Date(), "yyyy-MM-dd");
    const usedDays = calculateDays(oldEnrollment.startDate, refundDate);
    const remainingDays = Math.max(0, totalDays - usedDays);
    const fullDailyRate = Number(course.unitRate ?? 0);
    const refundBeforeProcessing: number | any = Number(
      oldEnrollment.commitedAmount - usedDays * fullDailyRate
    ).toFixed(2);
    const fullTotalAtFullRate = totalDays * fullDailyRate;
    const originalCommittedAmount = Number(oldEnrollment.commitedAmount ?? 0);
    const discountApplied = Math.max(
      0,
      fullTotalAtFullRate - originalCommittedAmount
    );
    const processingCharge = Number(values.processingCharge ?? 0);
    const finalRefundAmount = Math.max(
      0,
      Number(refundBeforeProcessing) - processingCharge
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

      const paymentPayload: any = {
        paymentType: "refund",
        enrollmentId: Number(values.enrollmentId) || null,
        paymentMode: values.paymentMode || "cash",
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
        memberName: oldEnrollment?.memberName || null,
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

  const fields = [
    {
      name: "processingCharge",
      label: "Processing Charge (₹)",
      type: "number",
      value: values.processingCharge,
      icon: Zap,
    },
    {
      name: "paymentMode",
      label: "Payment Mode",
      type: "select",
      required: true,
      options: [
        { label: "Cash", value: "cash" },
        { label: "Bank Transfer", value: "bank" },
        { label: "UPI", value: "upi" },
        { label: "Other", value: "other" },
      ],
      value: values.paymentMode,
      icon: Wallet,
    },
    {
      name: "transactionId",
      label: "Transaction ID (if non-cash)",
      type: "text",
      required: values.paymentMode !== "cash",
      value: values.transactionId,
      icon: CreditCard,
    },
    {
      name: "remarks",
      label: "Remarks",
      type: "textarea",
      value: values.remarks,
      icon: FileText,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const DetailRow = ({
    icon: Icon,
    label,
    value,
    valueClass = "",
  }: {
    icon: LucideIcon;
    label: string;
    value: string | Date | number | boolean;
    valueClass?: string;
  }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
        <Icon className="w-4 h-4 mr-2 text-blue-500 shrink-0" />
        {label}
      </span>
      <span
        className={`text-sm font-medium text-gray-900 dark:text-white ${valueClass} text-right break-words`}
      >
        {value as any}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <header className="sticky top-0 z-10 px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <DollarSign className="w-6 h-6 mr-3 text-blue-600" />
          Enrollment Refund
          <span className="ml-3 px-3 py-1 text-sm font-mono bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-300 flex items-center">
            <Hash className="w-4 h-4 mr-1" />
            {id}
          </span>
        </h1>
      </header>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex-grow overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6"
      >
        <motion.div
          variants={itemVariants}
          className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center pb-2 border-b border-gray-200 dark:border-gray-700">
            <CreditCard className="w-5 h-5 mr-2 text-blue-500" />
            Processing and Payment Details
          </h2>
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
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex justify-center py-2"
        >
          <ArrowDown className="w-6 h-6 text-blue-400 dark:text-blue-600 animate-bounce" />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="p-6 bg-blue-600 dark:bg-blue-900 rounded-xl shadow-2xl shadow-blue-500/50 dark:shadow-blue-900/50 text-white"
        >
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold flex items-center">
              <DollarSign className="w-6 h-6 mr-3" />
              NET REFUND PAYABLE
            </span>
            <span className="text-4xl font-extrabold">
              ₹{Number(computed.finalRefundAmount).toFixed(2)}
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            variants={itemVariants}
            className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center pb-2 border-b border-gray-200 dark:border-gray-700">
              <Calculator className="w-5 h-5 mr-2 text-blue-500" />
              Enrollment and Charge Breakdown
            </h2>

            <div className="space-y-1">
              <DetailRow
                icon={Wallet}
                label="Original Committed Amount"
                value={`₹${Number(computed.originalCommittedAmount).toFixed(
                  2
                )}`}
                valueClass="font-bold"
              />
              <DetailRow
                icon={XCircle}
                label="Original Discount Applied"
                value={`- ₹${Number(computed.originalDiscountApplied).toFixed(
                  2
                )}`}
                valueClass="text-red-500 dark:text-red-400"
              />
              <DetailRow
                icon={Grid3X3}
                label="Full Daily Rate"
                value={`₹${Number(computed.fullDailyRate).toFixed(2)}`}
              />
              <DetailRow
                icon={CheckCircle}
                label="Refund Before Processing"
                value={`₹${Number(computed.refundBeforeProcessing).toFixed(2)}`}
                valueClass="text-blue-600 dark:text-blue-400 font-bold"
              />
              <div className="h-2"></div>
              <DetailRow
                icon={Zap}
                label="Processing Charge (Deduction)"
                value={`- ₹${Number(values.processingCharge ?? 0).toFixed(2)}`}
                valueClass="text-red-600 dark:text-red-500 font-extrabold"
              />
            </div>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              variants={itemVariants}
              className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                Duration Usage
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-gray-700 rounded-lg text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total Days
                  </p>
                  <p className="text-xl font-bold text-blue-800 dark:text-blue-300">
                    {computed.totalDays}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-gray-700 rounded-lg text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Used Days
                  </p>
                  <p className="text-xl font-bold text-yellow-800 dark:text-yellow-300 flex items-center justify-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {computed.usedDays}
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-gray-700 rounded-lg text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Remaining
                  </p>
                  <p className="text-xl font-bold text-green-800 dark:text-green-300">
                    {computed.remainingDays}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                <List className="w-4 h-4 mr-2 text-blue-500" />
                Recorded Payment Details
              </h3>
              <DetailRow
                icon={DollarSign}
                label="Payment Type"
                value="Refund"
              />
              <DetailRow
                icon={CreditCard}
                label="Payment Mode"
                value={values.paymentMode}
              />
              {values.paymentMode !== "cash" && (
                <DetailRow
                  icon={FileText}
                  label="Transaction ID"
                  value={values.transactionId || "—"}
                />
              )}
              <DetailRow
                icon={FileText}
                label="Remarks"
                value={values.remarks || "—"}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="shrink-0 sticky bottom-0 z-10">
        <FormFooter
          onClose={() => navigate("/enrollment")}
          onSubmit={handleSubmit}
          submitLabel={`Refund (₹${Number(computed.finalRefundAmount).toFixed(
            2
          )})`}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export default RefundEnrollment;