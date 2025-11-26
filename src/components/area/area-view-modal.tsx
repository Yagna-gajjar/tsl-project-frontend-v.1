"use client";

import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { Area } from "@/types/area";
import { getAreaById } from "@/api/area.api";
import {
  Home,
  Tag,
  Box,
  Ruler,
  Square,
  Layers,
  Map,
  Calendar,
} from "lucide-react";
import type { FieldConfig } from "@/components/view-modal/types";

type Props = {
  isOpen: boolean;
  areaId?: number;
  onClose: () => void;
};

const fields: FieldConfig<Area>[] = [
  { key: "areaId", label: "Area ID", icon: Tag },

  { key: "areaName", label: "Area Name", icon: Home },

  { key: "facilityName", label: "Facility Name", icon: Layers },

  { key: "facilityId", label: "Facility ID", icon: Layers },

  { key: "areaDimension", label: "Area Dimension", icon: Ruler },

  { key: "areaSQFT", label: "Area (SQFT)", icon: Square },

  { key: "portion", label: "Portion", icon: Box },

  { key: "groundAreaPart", label: "Ground Area Part", icon: Map },

  {
    key: "createdAt",
    label: "Created At",
    icon: Calendar,
    render: (v: any) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Calendar,
    render: (v: any) => (v ? new Date(v).toLocaleString() : "-"),
  },
];

export default function AreaViewModal({ isOpen, areaId, onClose }: Props) {
  const fetchFn = useCallback(
    async (id?: number | string) => {
      const useId = id ?? areaId;
      if (!useId) throw new Error("Area ID missing");

      const res = await getAreaById(Number(useId));

      // normalize: API may return { success, data } or raw area
      if (res && (res as any).data) return (res as any).data as Area;

      return res as Area;
    },
    [areaId]
  );

  return (
    <ViewModal<Area>
      isOpen={isOpen}
      onClose={onClose}
      itemId={areaId}
      fetchFn={fetchFn}
      fields={fields}
      title="View Area"
      layout="grid"
    />
  );
}
