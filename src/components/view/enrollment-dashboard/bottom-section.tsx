import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  GitBranch,
  GitMerge,
  History,
  Calendar,
  AlertCircle,
  TrendingUp,
  ArrowRightLeft,
  CheckCircle2,
  CreditCard,
  Clock,
  LinkIcon,
} from "lucide-react";
import type { Batch } from "@/types/batch";
import type { Payment } from "@/types/payment";
import { PaymentFormModal } from "../payment/payment-form-modal";
import { Button } from "@/components/ui/button";
import EnrollmentChangeActions, {
  type EnrollmentSummary,
} from "./enrollment-change-actions";
import AppointmentModal from "./appointment-modal";

export interface EnrollmentHistoryItem {
  enrollmentId: number;
  enrollmentDate: string;
  startDate: string;
  endDate: string;
  academyName: string;
  courseName: string;
  status: "active" | "changed" | string;
  changeType: string | null;
  source: string;
  billingAmount?: string | number | null;
  processingCharge?: string | number | null;
  commitedAmount: number | string;
  memberFirstName?: string;
  memberLastName?: string;
  payments?: Payment[];
  batches?: Batch[];
  adjustment?: string | number | null;
  sessionUnits?: number | null;
  memberId?: number | null;
  academyId?: number;
}

interface EnrollmentHistoryProps {
  selectedMemberId?: number | null;
  historyData: EnrollmentHistoryItem[] | null;
}

function BatchTimeline({ batches }: { batches: Batch[] | any }) {
  const activeBatches = batches.filter((b: Batch) => b.status === "active");
  const inactiveBatches = batches.filter((b: Batch) => b.status === "inactive");

  return (
    <div className="space-y-4">
      {activeBatches.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-green-600 dark:text-green-400" />
            Active Batches
          </h4>
          {activeBatches.map((batch: Batch | any, idx: number) => (
            <motion.div
              key={batch.batchMemberId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative pl-6 py-2 border-l-2 border-green-400 dark:border-green-500 bg-green-50/50 dark:bg-green-900/20 rounded-r-lg px-3"
            >
              <div className="absolute -left-2 top-2 h-3 w-3 rounded-full bg-green-500 dark:bg-green-400 border-2 border-white dark:border-slate-900" />
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    {batch.batchName}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(batch.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    →{" "}
                    {new Date(batch.endDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="px-2 py-1 bg-green-200 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-bold rounded">
                  Active
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {inactiveBatches.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <GitMerge className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Changed Batches
          </h4>
          {inactiveBatches.map((batch: Batch | any, idx: number) => (
            <motion.div
              key={batch.batchMemberId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: activeBatches.length * 0.1 + idx * 0.1 }}
              className="relative pl-6 py-2 border-l-2 border-amber-300 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-900/20 rounded-r-lg px-3 opacity-75"
            >
              <div className="absolute -left-2 top-2 h-3 w-3 rounded-full bg-amber-500 dark:bg-amber-400 border-2 border-white dark:border-slate-900" />
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm line-through">
                    {batch.batchName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(batch.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    →{" "}
                    {new Date(batch.endDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="px-2 py-1 bg-green-200 dark:bg-green-700/60 text-green-600 dark:text-green-400 text-xs font-bold rounded">
                  Completed
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentFlow({
  payments,
  onOpenPaymentModal,
  committed,
}: {
  payments: Payment[] | any;
  onOpenPaymentModal: (payment: Payment | any) => void;
  committed: number | any;
}) {
  const totalPaidAcrossPayments = payments.reduce(
    (sum: number, p: Payment) => sum + Number(p.paid),
    0
  );
  const isFullyPaid = totalPaidAcrossPayments >= committed;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        Payment Flow
      </h4>
      {payments.map((payment: Payment | any, idx: number) => {
        const paidAmount = Number.parseFloat(payment.paid);
        const totalAmount = Number.parseFloat(payment.totalAmount);
        const isComplete = Number.parseFloat(payment.remaining) === 0;

        return (
          <motion.div
            key={payment.paymentId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                ) : (
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {payment.paymentType}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {payment.transactionId}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  ₹{paidAmount.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  of ₹{totalAmount.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-slate-600 dark:text-slate-400">
                {payment.paymentMode}
              </span>

              {isComplete || isFullyPaid ? (
                <span className="font-semibold text-green-500 dark:text-green-500">
                  Completed
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    ₹{Number.parseFloat(payment.remaining).toFixed(2)} remaining
                  </span>
                  <button
                    onClick={() => onOpenPaymentModal(payment)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                  >
                    Pay Now
                  </button>
                </div>
              )}
            </div>

            {payment.paymentRemarks && (
              <p className="text-xs text-slate-600 dark:text-slate-400 italic border-t border-blue-200 dark:border-blue-800 pt-2 mt-2">
                {payment.paymentRemarks}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export default function EnrollmentHistory({
  selectedMemberId,
  historyData,
}: EnrollmentHistoryProps) {
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedCommittedAmount, setSelectedCommittedAmount] = useState<
    string | number
  >(0);

  const [selectedEnrollment, setSelectedEnrollment] =
    useState<EnrollmentSummary | null>(null);

  const [changeDialogOpen, setChangeDialogOpen] = useState(false);

  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);

  const toggleExpand = (enrollmentId: number) => {
    setExpandedItems((prev) =>
      prev.includes(enrollmentId)
        ? prev.filter((id) => id !== enrollmentId)
        : [...prev, enrollmentId]
    );
  };

  const handleOpenPaymentModal = (
    payment: Payment,
    committedAmount: string | number
  ) => {
    setSelectedPayment(payment);
    setSelectedCommittedAmount(committedAmount);
    setIsModalOpen(true);
  };

  const getDuration = (start?: string, end?: string) => {
    if (!start || !end) return 0;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const committedAmountToNumber = (value: number | string) => {
    if (typeof value === "number") return value;
    const n = Number.parseFloat(String(value || "0"));
    return isNaN(n) ? 0 : n;
  };

  const openChangeDialogFor = (item: EnrollmentHistoryItem) => {
    setSelectedEnrollment({
      enrollmentId: item.enrollmentId,
      courseName: item.courseName,
      academyName: item.academyName,
    });
    setChangeDialogOpen(true);
  };

  const openAppointmentDialog = (item: EnrollmentHistoryItem) => {
    setSelectedEnrollment({
      enrollmentId: item.enrollmentId,
      memberId: selectedMemberId,
      courseName: item.courseName,
      academyName: item.academyName,
      sessionUnits: item.sessionUnits,
      academyId: item.academyId,
    });
    setAppointmentDialogOpen(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-full transition-colors duration-300 overflow-y-auto"
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Enrollment History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Courses, batches & payment tracking
              </p>
            </div>
          </div>
          {historyData && historyData.length > 0 ? (
            <div className="space-y-4">
              {historyData
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.startDate).getTime() -
                    new Date(a.startDate).getTime()
                )
                .map((item, index) => {
                  const isExpanded = expandedItems.includes(item.enrollmentId);
                  const hasBatches = item.batches && item.batches.length > 0;
                  const hasPayments = item.payments && item.payments.length > 0;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2 flex-1">
                            <span
                              className={`inline-block px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full border ${
                                item.status === "active"
                                  ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                                  : item.changeType === "course-change"
                                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                              }`}
                            >
                              {item.changeType
                                ? item.changeType.replace("-", " ")
                                : item.status}
                            </span>

                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                              {item.courseName}
                            </h3>

                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                              <TrendingUp className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                              <span className="font-semibold">
                                {item.academyName}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:items-end gap-2">
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                ₹
                              </span>
                              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                                {committedAmountToNumber(
                                  item.commitedAmount
                                ).toLocaleString("en-IN", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}
                              </span>
                            </div>

                            {item.processingCharge &&
                              Number(item.processingCharge) > 0 && (
                                <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                  +₹{Number(item.processingCharge).toFixed(2)}{" "}
                                  processing
                                </div>
                              )}
                            {item.adjustment && Number(item.adjustment) > 0 && (
                              <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                +₹{Number(item.adjustment).toFixed(2)}{" "}
                                adjustment
                              </div>
                            )}

                            <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 mt-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>
                                {getDuration(item.startDate, item.endDate)} days
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            {item.source === "EnrollmentChange" ? (
                              <ArrowRightLeft className="h-3.5 w-3.5" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            {item.source}
                          </span>

                          <div className="flex gap-3">
                            {item.sessionUnits && item.sessionUnits !== 0 && (
                              <Button
                                className={`text-sm`}
                                onClick={() => openAppointmentDialog(item)}
                              >
                                Appointment
                              </Button>
                            )}
                            {!item.changeType &&
                              item.status.toLowerCase() === "active" && (
                                <Button
                                  className={`text-sm`}
                                  onClick={() => openChangeDialogFor(item)}
                                >
                                  Change
                                </Button>
                              )}
                            {(hasBatches || hasPayments) &&
                              !item.changeType && (
                                <button
                                  onClick={() =>
                                    toggleExpand(item.enrollmentId)
                                  }
                                  className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}
                                >
                                  <LinkIcon className="h-3.5 w-3.5" />
                                  <span className="font-semibold">
                                    {(item.batches?.length || 0) +
                                      (item.payments?.length || 0)}{" "}
                                    links
                                  </span>
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${
                                      isExpanded ? "rotate-180" : ""
                                    }`}
                                  />
                                </button>
                              )}
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded &&
                          !item.changeType &&
                          (hasBatches || hasPayments) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-6"
                            >
                              {hasBatches && (
                                <BatchTimeline batches={item.batches} />
                              )}

                              {hasPayments && (
                                <PaymentFlow
                                  payments={item.payments}
                                  onOpenPaymentModal={(payment) =>
                                    handleOpenPaymentModal(
                                      payment,
                                      item.commitedAmount
                                    )
                                  }
                                  committed={item.commitedAmount}
                                />
                              )}
                            </motion.div>
                          )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 gap-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50"
            >
              <div className="p-4 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                <AlertCircle className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  No history found
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
                  {selectedMemberId
                    ? "This member hasn't enrolled in any courses yet."
                    : "Enrollment history will appear here once available."}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <PaymentFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            payment={selectedPayment}
            committedAmount={selectedCommittedAmount}
          />
        )}
      </AnimatePresence>
      <EnrollmentChangeActions
        open={changeDialogOpen}
        onOpenChange={(v) => setChangeDialogOpen(v)}
        selectedEnrollment={selectedEnrollment}
      />
      {selectedEnrollment?.memberId && (
        <AppointmentModal
          open={appointmentDialogOpen}
          onOpenChange={(v) => setAppointmentDialogOpen(v)}
          selectedEnrollment={selectedEnrollment as any}
        />
      )}
    </>
  );
}
