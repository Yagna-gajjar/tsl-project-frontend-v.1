import { useCallback } from "react";
import { ViewModal, type FieldConfig } from "@/components/view-modal/view-modal";
import type { Batch } from "@/types/batch";
import { getBatchById } from "@/api/batch.api";
import {
  Type,
  Users,
  Building2,
  Calendar,
  Clock,
  Hash,
  Activity,
  Layers,
  UserCheck,
  Timer
} from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item?: Batch | null;
};

const formatDate = (v: any) => (v ? new Date(v).toLocaleDateString("en-IN") : "-");
const formatTime = (v: any) => (v && typeof v === 'string' ? v.substring(0, 5) : "-");

const fields: FieldConfig<Batch>[] = [
  { key: "batchName", label: "Batch Name", icon: Type },
  { key: "batchType", label: "Batch Type", icon: Layers },
  { key: "courseName", label: "Course" },
  { key: "entityName", label: "Entity", icon: Building2 },
  { key: "activityName", label: "Activity", icon: Activity },
  {
    key: "startTime",
    label: "Start Time",
    icon: Clock,
    render: (v) => formatTime(v),
  },
  {
    key: "endTime",
    label: "End Time",
    icon: Clock,
    render: (v) => formatTime(v),
  },
  {
    key: "sessionMinutes",
    label: "Duration",
    icon: Timer,
    render: (v) => v ? `${v} mins` : "-"
  },
  { key: "daysPattern", label: "Days Pattern", icon: Hash },
  {
    key: "maxCapacity",
    label: "Max Capacity",
    icon: Users,
    render: (v) => (Number.isFinite(Number(v)) ? Number(v) : 1)
  },
  {
    key: "activeMemberCount",
    label: "Current Members",
    icon: UserCheck
  },
  {
    key: "introduceDate",
    label: "Introduce Date",
    icon: Calendar,
    render: (v) => formatDate(v),
  },
  {
    key: "suspendedDate",
    label: "Suspended Date",
    icon: Calendar,
    render: (v) => formatDate(v),
  },
  {
    key: "status",
    label: "Status",
    icon: Activity,
    render: (v) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${v === "active"
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
          }`}
      >
        {(v as string) ?? "-"}
      </span>
    ),
  },
  {
    key: "createdAt",
    label: "Created At",
    icon: Clock,
    render: (v) => (v ? new Date(v as string).toLocaleString() : "-"),
  },
];

export default function BatchViewModal({ isOpen, onClose, item }: Props) {
  const fetchFn = useCallback(
    async (id: string | number) => {
      if (!id) throw new Error("No batch ID");
      const response = await getBatchById(Number(id));
      return response.data as Batch;
    },
    []
  );

  return (
    <ViewModal<Batch>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(item?.batchId)}
      fetchFn={fetchFn}
      fields={fields}
      title="Batch Details"
    />
  );
}