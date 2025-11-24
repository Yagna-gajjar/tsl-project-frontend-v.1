import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
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

const fields = [
  { key: "categoryName", label: "Category", icon: Layers },
  { key: "shortName", label: "Short Name", icon: Text },
  { key: "access", label: "Access", icon: Key },
  { key: "details", label: "Details", icon: FileText },

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

export default function TeamCategoryViewModal({
  isOpen,
  onClose,
  item,
}: Props) {
  const fetchFn = useCallback(
    async (id?: number | string) => {
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
      fields={fields as any}
      title="View Team Category"
    />
  );
}
