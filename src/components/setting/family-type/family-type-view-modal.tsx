import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { FamilyType } from "@/types/familyType";
import {
  Type,
  Tag,
  Users,
  Calendar,
  Clock,
} from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item?: FamilyType | null;
};

const fields = [
  { key: "familyTypeName", label: "Family Type", icon: Type },
  { key: "prefix", label: "Prefix", icon: Tag },
  { key: "maxMembers", label: "Max Members", icon: Users },

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

export default function FamilyTypeViewModal({ isOpen, onClose, item }: Props) {
  const fetchFn = useCallback(
    async (id?: number | string) => {
      if (!item) throw new Error("No data");
      return item;
    },
    [item]
  );

  return (
    <ViewModal<FamilyType>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(item?.familyTypeId)}
      fetchFn={fetchFn}
      fields={fields as any}
      title="View Family Type"
    />
  );
}
