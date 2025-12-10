import { useCallback } from "react";
import { Hash, Calendar, BookOpen, CheckCircle, Users, CreditCard, Building2 } from "lucide-react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { membershipMaster } from "@/types/memberShipMaster";
import { getMembershipMasterById } from "@/api/membershipMaster.api";
import type { FieldConfig } from "@/components/view-modal/types";
import type { Response } from "@/types/response";

type Props = {
  isOpen: boolean;
  membershipMasterId?: number;
  onClose: () => void;
};

const toRs = (v?: number) => `Rs. ${Number(v ?? 0).toFixed(2)}`;

const boolBadge = (v?: boolean) => {
  const yes = !!v;
  const color = yes ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700";
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{yes ? "Yes" : "No"}</span>;
};

const dateRender = (v?: Date | string | null) => (v ? new Date(v as Date).toLocaleString() : "-");

const fields: FieldConfig<membershipMaster>[] = [
  { key: "membershipMasterId", label: "ID", icon: Hash },
  { key: "membershipType", label: "Membership Type", icon: Users },
  {
    key: "introduceDate",
    label: "Introduce Date",
    icon: Calendar,
    render: (v) => dateRender(v as Date | string),
  },
  {
    key: "suspendDate",
    label: "Suspend Date",
    icon: Calendar,
    render: (v) => dateRender(v as Date | string),
  },
  {
    key: "membershipDurationInDays",
    label: "Duration (days)",
    icon: Hash,
    render: (v) => (typeof v === "number" ? String(v) : "-"),
  },
  {
    key: "issueCharge",
    label: "Issue Charge",
    icon: CreditCard,
    render: (v) => toRs(v as number),
  },
  {
    key: "minFBalance",
    label: "Min F Balance",
    icon: CreditCard,
    render: (v) => (v !== undefined ? Number(v).toFixed(2) : "-"),
  },
  {
    key: "minCBalance",
    label: "Min C Balance",
    icon: CreditCard,
    render: (v) => (v !== undefined ? Number(v).toFixed(2) : "-"),
  },
  {
    key: "minVBalance",
    label: "Min V Balance",
    icon: CreditCard,
    render: (v) => (v !== undefined ? Number(v).toFixed(2) : "-"),
  },
  {
    key: "bookingDiscount",
    label: "Booking Discount",
    icon: Building2,
    render: (v) => `${Number(v ?? 0).toFixed(2)}%`,
  },
  {
    key: "graceDays",
    label: "Grace Days",
    icon: Hash,
    render: (v) => (v !== undefined ? String(v) : "-"),
  },
  {
    key: "regMemberIncluded",
    label: "Reg Members Included",
    icon: Users,
    render: (v) => (v !== undefined ? String(v) : "-"),
  },
  {
    key: "guardianEntry",
    label: "Guardian Entry",
    icon: CheckCircle,
    render: (v) => boolBadge(v as boolean),
  },
  {
    key: "guestAllowed",
    label: "Guest Allowed",
    icon: CheckCircle,
    render: (v) => boolBadge(v as boolean),
  },
  {
    key: "rfid",
    label: "RFID",
    icon: Hash,
    render: (v) => (v ? String(v) : "-"),
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
    render: (v) => boolBadge(v as boolean),
  },
  {
    key: "anniversaryVenueUsage",
    label: "Anniversary Venue Usage",
    icon: BookOpen,
    render: (v) => boolBadge(v as boolean),
  },
  {
    key: "cancallationCharges",
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
    render: (v) => dateRender(v as Date | string),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Calendar,
    render: (v) => dateRender(v as Date | string),
  },
];

export default function MembershipMasterViewModal({
  isOpen,
  membershipMasterId,
  onClose,
}: Props) {
  const fetchFn = useCallback(
    async (id?: number | string): Promise<membershipMaster> => {
      const useId = id ?? membershipMasterId;
      if (!useId) throw new Error("MembershipMaster ID missing");

      const res: Response<membershipMaster> = await getMembershipMasterById(Number(useId));

      if (res && res.data) return res.data as membershipMaster;
      return {} as membershipMaster;
    },
    [membershipMasterId]
  );

  return (
    <ViewModal<membershipMaster>
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
