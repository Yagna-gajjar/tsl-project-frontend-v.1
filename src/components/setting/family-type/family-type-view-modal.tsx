import { useCallback } from "react";
import { ViewModal, type FieldConfig } from "@/components/view-modal/view-modal";
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

const fields: FieldConfig<FamilyType>[] = [
  { key: "familyTypeName", label: "Family Type", icon: Type },
  { key: "prefix", label: "Prefix", icon: Tag },
  { key: "maxMembers", label: "Max Members", icon: Users },

  {
    key: "createdAt",
    label: "Created At",
    icon: Calendar,
    render: (v: FamilyType["createdAt"]) =>
      v ? new Date(v).toLocaleString() : "-",
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Clock,
    render: (v: FamilyType["updatedAt"]) =>
      v ? new Date(v).toLocaleString() : "-",
  },
];

export default function FamilyTypeViewModal({ isOpen, onClose, item }: Props) {
  const fetchFn = useCallback(
    async (_?: number | string) => {
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
      fields={fields}
      title="View Family Type"
    />
  );
}
