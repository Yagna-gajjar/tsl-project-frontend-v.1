import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { Member } from "@/types/member";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item?: Member | null;
};

import {
  User,
  UserCircle2,
  UserSquare2,
  Calendar,
  Mail,
  Phone,
  Venus,
  Users,
  Droplet,
  Car,
  BadgeInfo,
  StickyNote,
  Clock,
} from "lucide-react";

const defaultFields = [
  { key: "memberFirstName", label: "First Name", icon: User },
  { key: "memberMiddleName", label: "Middle Name", icon: UserCircle2 },
  { key: "memberLastName", label: "Last Name", icon: UserSquare2 },

  {
    key: "dob",
    label: "DOB",
    icon: Calendar,
    render: (v: Member) => (v ? new Date(v).toLocaleDateString() : "-"),
  },

  { key: "email", label: "Email", icon: Mail },
  { key: "contactNumber", label: "Contact", icon: Phone },
  { key: "gender", label: "Gender", icon: Venus },
  { key: "relationship", label: "Relationship", icon: Users },
  { key: "bloodGroup", label: "Blood Group", icon: Droplet },
  { key: "transportMode", label: "Transport Mode", icon: Car },
  { key: "status", label: "Status", icon: BadgeInfo },
  { key: "remarks", label: "Remarks", icon: StickyNote },

  {
    key: "createdAt",
    label: "Created At",
    icon: Calendar,
    render: (v: any) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Clock,
    render: (v: any) => (v ? new Date(v).toLocaleString() : "-"),
  },
];

export default function MemberViewModal({ isOpen, onClose, item }: Props) {
  const fetchFn = useCallback(
    async (id?: number | string) => {
      if (!item) throw new Error("No data");
      return item;
    },
    [item]
  );

  return (
    <ViewModal<Member>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(item?.memberId)}
      fetchFn={fetchFn}
      fields={defaultFields as any}
      title="View Member"
    />
  );
}
