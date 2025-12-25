import { useCallback } from "react";
import {
  ViewModal,
  type FieldConfig,
} from "@/components/view-modal/view-modal";
import type { Facility } from "@/types/facility";
import {
  Home,
  Tag,
  Box,
  Zap,
  Users,
  Music,
  Megaphone,
  FileText,
  Calendar,
  Clock,
  Layers,
} from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item?: Facility | null;
};

const fields: FieldConfig<Facility>[] = [
  { key: "facilityName", label: "Facility Name", icon: Home },
  { key: "facilityType", label: "Facility Type", icon: Tag },
  { key: "facilityDimension", label: "Facility Dimension", icon: Box },
  { key: "areaSQFT", label: "Area (SQFT)", icon: Zap },
  { key: "academicCapacity", label: "Academic Capacity", icon: Users },
  { key: "recreationCapacity", label: "Recreation Capacity", icon: Music },
  { key: "eventCapacity", label: "Event Capacity", icon: Megaphone },
  { key: "level", label: "Level", icon: Layers },
  { key: "description", label: "Description", icon: FileText },

  {
    key: "createdAt",
    label: "Created At",
    icon: Calendar,
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Clock,
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },
];

export default function FacilityViewModal({ isOpen, onClose, item }: Props) {
  const fetchFn = useCallback(
    async () => {
      if (!item) throw new Error("No data");
      return item;
    },
    [item]
  );

  return (
    <ViewModal<Facility>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(item?.facilityId)}
      fetchFn={fetchFn}
      fields={fields}
      title="View Facility"
    />
  );
}
