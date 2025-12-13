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
  { key: "membershipMasterId", label: "Membership Master", icon: Hash },
  { key: "accountId", label: "Account", icon: Hash },

  { key: "startDate", label: "Start Date", icon: Calendar, render: dateRender },
  { key: "endDate", label: "End Date", icon: Calendar, render: dateRender },
  { key: "graceDate", label: "Grace Date", icon: Calendar, render: dateRender },

  { key: "members", label: "Members", icon: Hash },

  {
    key: "totalIssueCharges",
    label: "Issue Charges",
    icon: CreditCard,
    render: toRs,
  },
  {
    key: "appDiscount",
    label: "App Discount",
    icon: CreditCard,
    render: toRs,
  },
  {
    key: "totalSpendComm",
    label: "Total Spent",
    icon: CreditCard,
    render: toRs,
  },
  {
    key: "status",
    label: "Status",
    icon: CheckCircle,
  },
  {
    key: "cancelationDate",
    label: "Cancellation Date",
    icon: Calendar,
    render: dateRender,
  },
  {
    key: "createdAt",
    label: "Created At",
    icon: Calendar,
    render: dateRender,
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Calendar,
    render: dateRender,
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
