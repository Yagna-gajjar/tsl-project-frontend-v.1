// src/components/facility-allotment/FacilityAllotmentViewModal.tsx
"use client";

import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { FacilityAllotment } from "@/types/facilityAllotment";
import { getFacilityAllotmentById } from "@/api/facilityAllotment.api";
import { Layers, Map, Calendar, Tag } from "lucide-react";
import type { FieldConfig } from "@/components/view-modal/types";
import type { Response } from "@/types/response";

type Props = {
  isOpen: boolean;
  facilityAllotmentId?: number;
  onClose: () => void;
};

const fields: FieldConfig<FacilityAllotment>[] = [
  { key: "facilityAllotmentId", label: "ID", icon: Tag },
  { key: "facilityName", label: "Facility", icon: Layers },
  { key: "facilityId", label: "Facility ID", icon: Layers },
  { key: "areaName", label: "Area", icon: Map },
  { key: "areaId", label: "Area ID", icon: Map },
  { key: "batchName", label: "Batch", icon: Layers },
  { key: "batchId", label: "Batch ID", icon: Layers },
  { key: "assignmentDate", label: "Assignment Date", icon: Calendar },
  { key: "unAssignmentDate", label: "Unassignment Date", icon: Calendar },
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

export default function FacilityAllotmentViewModal({
  isOpen,
  facilityAllotmentId,
  onClose,
}: Props) {
  const fetchFn = useCallback(
    async (id?: number | string) => {
      const useId = id ?? facilityAllotmentId;
      if (!useId) throw new Error("ID missing");
      const res: Response = await getFacilityAllotmentById(Number(useId));
      if (res && res.data) return res.data as FacilityAllotment;
      return res;
    },
    [facilityAllotmentId]
  );

  return (
    <ViewModal<FacilityAllotment>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(facilityAllotmentId)}
      fetchFn={fetchFn as any}
      fields={fields}
      title="View Facility Allotment"
      layout="grid"
    />
  );
}
