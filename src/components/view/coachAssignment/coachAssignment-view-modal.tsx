import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { CoachAssignment } from "@/types/coachAssignment";
import { getCoachAssignmentById } from "@/api/coachAssignment.api";
import { User, Layers, Tag, Calendar, DollarSign } from "lucide-react";
import type { FieldConfig } from "@/components/view-modal/types";
import type { Response } from "@/types/response";

type Props = {
  isOpen: boolean;
  coachAssignmentId?: number;
  onClose: () => void;
};

const fields: FieldConfig<CoachAssignment>[] = [
  { key: "coachAssignmentId", label: "ID", icon: Tag },
  { key: "coachName", label: "Coach", icon: User },
  { key: "coachId", label: "Coach ID", icon: User },
  { key: "batchName", label: "Batch", icon: Layers },
  { key: "batchId", label: "Batch ID", icon: Layers },
  { key: "designation", label: "Designation", icon: Tag },
  { key: "responsibilities", label: "Responsibilities", icon: Tag },
  { key: "cost", label: "Cost", icon: DollarSign },
  { key: "startDate", label: "Start Date", icon: Calendar },
  { key: "endDate", label: "End Date", icon: Calendar },
  { key: "remarks", label: "Remarks", icon: Tag },
  {
    key: "createdAt",
    label: "Created At",
    icon: Calendar,
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Calendar,
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },
];

export default function CoachAssignmentViewModal({
  isOpen,
  coachAssignmentId,
  onClose,
}: Props) {
  const fetchFn = useCallback(
    async (id?: number | string) => {
      const useId = id ?? coachAssignmentId;
      if (!useId) throw new Error("ID missing");
      const res: Response = await getCoachAssignmentById(Number(useId));
      if (res && res.data) return res.data as CoachAssignment;
      return res;
    },
    [coachAssignmentId]
  );

  return (
    <ViewModal<CoachAssignment>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(coachAssignmentId)}
      fetchFn={fetchFn as any}
      fields={fields}
      title="View Coach Assignment"
      layout="grid"
    />
  );
}
