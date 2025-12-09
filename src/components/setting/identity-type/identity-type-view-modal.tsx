import { useCallback } from "react";
import { ViewModal, type FieldConfig } from "@/components/view-modal/view-modal";
import type { IdentityType } from "@/types/identityType";
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
  item?: IdentityType | null;
};

const fields: FieldConfig<IdentityType>[] = [
  { key: "familyTypeName", label: "Family Type", icon: Type },
  { key: "prefix", label: "Prefix", icon: Tag },
  { key: "maxMembers", label: "Max Members", icon: Users },
  {
    key: "createdAt",
    label: "Created At",
    icon: Calendar,
    render: (v: IdentityType["createdAt"]) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Clock,
    render: (v: IdentityType["updatedAt"]) => (v ? new Date(v).toLocaleString() : "-"),
  },
];

export default function IdentityTypeViewModal({
  isOpen,
  onClose,
  item,
}: Props) {
  const fetchFn = useCallback(
    async (_?: number | string) => {
      if (!item) throw new Error("No data");
      return item;
    },
    [item]
  );

  return (
    <ViewModal<IdentityType>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(item?.identityTypeId)}
      fetchFn={fetchFn}
      fields={fields}
      title="View Identity Type"
    />
  );
}
