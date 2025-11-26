import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { Activity } from "@/types/activity";
import {
  Type,
  Tag,
  FileText,
  Calendar,
  Clock,
} from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item?: Activity | null;
};

const fields = [
  { key: "activityName", label: "Activity Name", icon: Type },
  { key: "activityType", label: "Activity Type", icon: Tag },
  { key: "description", label: "Description", icon: FileText },

  {
    key: "createdAt",
    label: "Created At",
    icon: Calendar,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render: (v: any) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Clock,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render: (v: any) => (v ? new Date(v).toLocaleString() : "-"),
  },
] as any;

export default function ActivityViewModal({ isOpen, onClose, item }: Props) {
  const fetchFn = useCallback(
    async () => {
      if (!item) throw new Error("No data");
      return item;
    },
    [item]
  );

  return (
    <ViewModal<Activity>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(item?.activityId)}
      fetchFn={fetchFn}
      fields={fields}
      title="View Activity"
    />
  );
}
