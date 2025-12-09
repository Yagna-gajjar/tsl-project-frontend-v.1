import { useCallback } from "react";
import { ViewModal, type FieldConfig } from "@/components/view-modal/view-modal";
import type { Batch } from "@/types/batch";
import { getBatchById } from "@/api/batch.api";
import {
  Type,
  Users,
  Building2,
  MapPin,
  Calendar,
  Clock,
  Hash,
  Activity,
} from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item?: Batch | null;
};

const fields: FieldConfig<Batch>[] = [
  { key: "batchName", label: "Batch Name", icon: Type },
  { key: "courseName", label: "Course" },
  { key: "coachFirstName", label: "Coach", icon: Users },
  { key: "facilityName", label: "Facility", icon: Building2 },
  { key: "areaName", label: "Area", icon: MapPin },
  {
    key: "startTime",
    label: "Start Time",
    icon: Calendar,
    render: (v: Batch["startTime"]) => (v ? new Date(v).toLocaleDateString() : "-"),
  },
  {
    key: "endTime",
    label: "End Time",
    icon: Calendar,
    render: (v: Batch["endTime"]) => (v ? new Date(v).toLocaleDateString() : "-"),
  },
  {
    key: "introduceDate",
    label: "Introduce Date",
    icon: Calendar,
    render: (v: Batch["introduceDate"]) => (v ? new Date(v).toLocaleDateString() : "-"),
  },
  {
    key: "suspendedDate",
    label: "Suspended Date",
    icon: Calendar,
    render: (v: Batch["suspendedDate"]) => (v ? new Date(v).toLocaleDateString() : "-"),
  },
  { key: "weekDays", label: "Week Days", icon: Hash },
  {
    key: "status",
    label: "Status",
    icon: Activity,
    render: (v: Batch["status"]) => (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${v === "active"
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800"
          }`}
      >
        {v ?? "-"}
      </span>
    ),
  },
  {
    key: "createdAt",
    label: "Created At",
    icon: Clock,
    render: (v: Batch["createdAt"]) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Clock,
    render: (v: Batch["updatedAt"]) => (v ? new Date(v).toLocaleString() : "-"),
  },
];

export default function BatchViewModal({ isOpen, onClose, item }: Props) {
  const fetchFn = useCallback(
    async (id: string | number) => {
      if (!id) throw new Error("No batch ID");
      const response = await getBatchById(Number(id));
      const resBatch = response.data;

      return resBatch as Batch;
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
      title="View Batch"
    />
  );
}
