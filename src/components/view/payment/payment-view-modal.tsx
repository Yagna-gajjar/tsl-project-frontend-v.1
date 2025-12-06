"use client";

import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { Payment } from "@/types/payment";
import { getPaymentById } from "@/api/payment.api";
import { formatDateForInput } from "@/lib/utils";

import {
  Tag,
  CreditCard,
  Calendar,
  Clock,
  FileText,
  User,
    Hash,
  Banknote
} from "lucide-react";
import type { FieldConfig } from "@/components/view-modal/types";

type Props = {
  isOpen: boolean;
  paymentId?: number;
  onClose: () => void;
};

const fields: FieldConfig<Payment>[] = [
  { key: "paymentId", label: "Payment ID", icon: Tag },
  { key: "paymentType", label: "Payment Type", icon: CreditCard },
  { key: "paymentMode", label: "Payment Mode", icon: Banknote },
  { key: "transactionId", label: "Transaction ID", icon: Hash },
  { key: "enrollmentId", label: "Enrollment ID", icon: User },
  { key: "memberName", label: "Member", icon: User },
  { key: "academyName", label: "Academy", icon: FileText },
  { key: "courseName", label: "Course", icon: FileText },
  { key: "totalAmount", label: "Total Amount", icon: Banknote },
  { key: "paid", label: "Paid", icon: Banknote },
  { key: "remaining", label: "Remaining", icon: Banknote },
  { key: "paymentRemarks", label: "Remarks", icon: FileText },
  {
    key: "createdAt",
    label: "Created At",
    icon: Clock,
    render: (v) => (v ? formatDateForInput(v) : "-"),
  },
];

export default function PaymentViewModal({
  isOpen,
  paymentId,
  onClose,
}: Props) {
  const fetchFn = useCallback(
    async (id?: number | string): Promise<Payment> => {
      const useId = id ?? paymentId;
      if (!useId) throw new Error("Payment ID missing");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await getPaymentById(Number(useId));

      if (res && res.data) return res.data as Payment;

      return res as Payment;
    },
    [paymentId]
  );

  return (
    <ViewModal<Payment>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(paymentId)}
      fetchFn={fetchFn}
      fields={fields}
      title="View Payment"
      layout="grid"
    />
  );
}
