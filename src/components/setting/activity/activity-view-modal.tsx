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
    render: (v: Activity) => (v.createdAt ? new Date(v.createdAt).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Clock,
    render: (v: Activity) => (
      v.updatedAt ? new Date(v.updatedAt).toLocaleString() : "-"
    ),
  }
];

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
      fields={fields as any}
      title="View Activity"
    />
  );
}
