// MembershipViewModal.tsx
import { useCallback } from "react";
import { Hash, Calendar, CreditCard, CheckCircle } from "lucide-react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { membership } from "@/types/membership";
import { getMembershipById } from "@/api/membership.api";
import type { FieldConfig } from "@/components/view-modal/types";

type Props = {
  isOpen: boolean;
  membershipId?: number;
  onClose: () => void;
};

const toRs = (v?: number) => `Rs. ${Number(v ?? 0).toFixed(2)}`;
const dateRender = (v?: Date | string | null) =>
  v ? new Date(v as Date).toLocaleString() : "-";

const fields: FieldConfig<membership>[] = [
  { key: "membershipId", label: "ID", icon: Hash },
  { key: "membershipMasterId", label: "Master ID", icon: Hash },
  { key: "familyId", label: "Family ID", icon: Hash },
  {
    key: "startDate",
    label: "Start Date",
    icon: Calendar,
    render: (v) => dateRender(v),
  },
  {
    key: "endDate",
    label: "End Date",
    icon: Calendar,
    render: (v) => dateRender(v),
  },
  {
    key: "graceDate",
    label: "Grace Date",
    icon: Calendar,
    render: (v) => dateRender(v),
  },
  {
    key: "committedAmount",
    label: "Committed Amount",
    icon: CreditCard,
    render: (v) => toRs(v as number),
  },
  {
    key: "issueCharges",
    label: "Issue Charges",
    icon: CreditCard,
    render: (v) => toRs(v as number),
  },
  {
    key: "minVBalance",
    label: "Min V Balance",
    icon: CreditCard,
    render: (v) => Number(v ?? 0).toFixed(2),
  },
  {
    key: "minFBalance",
    label: "Min F Balance",
    icon: CreditCard,
    render: (v) => Number(v ?? 0).toFixed(2),
  },
  {
    key: "minCBalance",
    label: "Min C Balance",
    icon: CreditCard,
    render: (v) => Number(v ?? 0).toFixed(2),
  },
  { key: "paymentId", label: "Payment ID", icon: Hash },
  {
    key: "status",
    label: "Status",
    icon: CheckCircle,
    render: (v) => v || "-",
  },
  {
    key: "cancellationDate",
    label: "Cancellation Date",
    icon: Calendar,
    render: (v) => dateRender(v),
  },
  {
    key: "actualFBalance",
    label: "Actual F Balance",
    icon: CreditCard,
    render: (v) => Number(v ?? 0).toFixed(2),
  },
  {
    key: "actualCBalance",
    label: "Actual C Balance",
    icon: CreditCard,
    render: (v) => Number(v ?? 0).toFixed(2),
  },
  {
    key: "refundedAmount",
    label: "Refunded Amount",
    icon: CreditCard,
    render: (v) => toRs(v as number),
  },
  { key: "refundedPaymentId", label: "Refunded Payment ID", icon: Hash },
  {
    key: "cancellationCharges",
    label: "Cancellation Charges",
    icon: CreditCard,
    render: (v) => toRs(v as number),
  },
  {
    key: "createdAt",
    label: "Created At",
    icon: Calendar,
    render: (v) => dateRender(v),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Calendar,
    render: (v) => dateRender(v),
  },
];

export default function MembershipViewModal({
  isOpen,
  membershipId,
  onClose,
}: Props) {
  const fetchFn = useCallback(
    async (id?: number | string): Promise<membership> => {
      const useId = id ?? membershipId;
      if (!useId) throw new Error("Membership ID missing");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await getMembershipById(Number(useId));
      if (res && res.data) return res.data as membership;
      return res as membership;
    },
    [membershipId]
  );

  return (
    <ViewModal<membership>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(membershipId)}
      fetchFn={fetchFn}
      fields={fields}
      title="Membership Details"
      layout="grid"
    />
  );
}
