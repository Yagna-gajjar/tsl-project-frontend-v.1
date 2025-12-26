import { useCallback } from "react";
import {
  Hash,
  Calendar,
  BookOpen,
  CheckCircle,
  Users,
  CreditCard,
  IndianRupee,
} from "lucide-react";
import { ViewModal } from "@/components/view-modal/view-modal";
import { getMembershipMasterById } from "@/api/membershipMaster.api";
import type { FieldConfig } from "@/components/view-modal/types";
import type { Response } from "@/types/response";
import type { MembershipMaster } from "@/types/membershipMaster";

type Props = {
  isOpen: boolean;
  membershipMasterId?: number;
  onClose: () => void;
};

const toRs = (v?: number) => `Rs. ${Number(v ?? 0).toFixed(2)}`;

const boolBadge = (v?: boolean) => {
  const yes = !!v;
  const color = yes
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-700";
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {yes ? "Yes" : "No"}
    </span>
  );
};

const dateRender = (v?: Date | string | null) =>
  v ? new Date(v as Date).toLocaleString() : "-";

const fields: FieldConfig<MembershipMaster>[] = [
  { key: "membershipType", label: "Membership Type", icon: Users },
  {
    key: "entityName",
    label: "Entity Name",
    icon: Users,
  },
  {
    key: "introductionDate",
    label: "Introduce Date",
    icon: Calendar,
    render: (v) => dateRender(v as string),
  },
  {
    key: "suspensionDate",
    label: "Suspend Date",
    icon: Calendar,
    render: (v) => dateRender(v as string),
  },
  {
    key: "durationDays",
    label: "Duration (days)",
    icon: Hash,
    render: (v) => (typeof v === "number" ? String(v) : "-"),
  },
  {
    key: "billingEntityOfFamily",
    label: "billing Entity Of Family",
    icon: Hash,
    render: (v) => (typeof v === "number" ? String(v) : "-"),
  },
  {
    key: "minIssueCharge",
    label: "Issue Charge",
    icon: CreditCard,
    render: (v) => toRs(v as number),
  },
  {
    key: "caDepositPR",
    label: "Min F Balance",
    icon: CreditCard,
    render: (v) => Number(v),
  },
  {
    key: "perMemberRegCharge",
    label: "Reg Charge / Member",
    icon: IndianRupee,
    render: (v) => Number(v),
  },
  {
    key: "commPerMemberPerMonth",
    label: "CA / Member / Month",
    icon: IndianRupee,
    render: (v) => Number(v),
  },
  {
    key: "memberLimit",
    label: "Member Limit",
    icon: IndianRupee,
    render: (v) => Number(v),
  },
  {
    key: "fBalPrInCa",
    label: "Min F Balance",
    icon: CreditCard,
    render: (v) => Number(v),
  },
  {
    key: "cBalPrInCa",
    label: "Min C Balance",
    icon: CreditCard,
    render: (v) => Number(v),
  },
  {
    key: "vBalPrInCa",
    label: "Min V Balance (Gift Voucher)",
    icon: CreditCard,
    render: (v) => Number(v),
  },
  {
    key: "graceDays",
    label: "Grace Days",
    icon: Hash,
    render: (v) => Number(v),
  },
  {
    key: "guestAllowed",
    label: "Guest Allowed",
    icon: CheckCircle,
    render: (v) => boolBadge(v as boolean),
  },
  {
    key: "clubAccess",
    label: "Club Access",
    icon: CheckCircle,
    render: (v) => boolBadge(v as boolean),
  },
  {
    key: "birthdayVenueUsage",
    label: "Birthday Venue Usage",
    icon: BookOpen,
    render: (v) => String(v ?? 0),
  },
  {
    key: "anniversaryVenueUsage",
    label: "Anniversary Venue Usage",
    icon: BookOpen,
    render: (v) => String(v ?? 0),
  },
  {
    key: "cancelChargesPrOnCa",
    label: "Cancellation Charges",
    icon: CreditCard,
    render: (v) => toRs(v as number),
  },
  {
    key: "membershipDetails",
    label: "Details",
    icon: BookOpen,
    render: (v) => (v ? String(v) : "-"),
  },
  {
    key: "createdAt",
    label: "Created At",
    icon: Calendar,
    render: (v) => dateRender(v as string),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Calendar,
    render: (v) => dateRender(v as string),
  },
];

export default function MembershipMasterViewModal({
  isOpen,
  membershipMasterId,
  onClose,
}: Props) {
  const fetchFn = useCallback(
    async (id?: number | string): Promise<MembershipMaster> => {
      const useId = id ?? membershipMasterId;
      if (!useId) throw new Error("MembershipMaster ID missing");

      const res: Response<MembershipMaster> = await getMembershipMasterById(
        Number(useId)
      );

      if (res && res.data) return res.data as MembershipMaster;
      return {} as MembershipMaster;
    },
    [membershipMasterId]
  );

  return (
    <ViewModal<MembershipMaster>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(membershipMasterId)}
      fetchFn={fetchFn}
      fields={fields}
      title="Membership Master Details"
      layout="grid"
    />
  );
}
