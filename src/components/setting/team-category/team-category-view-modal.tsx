import { useCallback } from "react";
import { ViewModal, type FieldConfig } from "@/components/view-modal/view-modal";
import type { TeamCategory } from "@/types/teamCategory";
import {
  Layers,
  Text,
  Key,
  FileText,
  Calendar,
  Clock,
} from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item?: TeamCategory | null;
};

const fields: FieldConfig<TeamCategory>[] = [
  { key: "categoryName", label: "Category", icon: Layers },
  { key: "shortName", label: "Short Name", icon: Text },
  { key: "access", label: "Access", icon: Key },
  { key: "details", label: "Details", icon: FileText },

  {
    key: "createdAt",
    label: "Created At",
    icon: Calendar,
    render: (v) => (v ? new Date(v as string).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Clock,
    render: (v) => (v ? new Date(v as string).toLocaleString() : "-"),
  },
];

export default function TeamCategoryViewModal({
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
    <ViewModal<TeamCategory>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(item?.teamCategoryId)}
      fetchFn={fetchFn}
      fields={fields}
      title="View Team Category"
    />
  );
}
