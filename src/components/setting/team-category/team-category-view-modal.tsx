"use client";

import React, { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { TeamCategory } from "@/types/teamCategory";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item?: TeamCategory | null;
};

const fields = [
  { key: "teamCategoryId", label: "ID" },
  { key: "categoryName", label: "Category" },
  { key: "shortName", label: "Short Name" },
  { key: "access", label: "Access" },
  { key: "details", label: "Details" },
  {
    key: "createdAt",
    label: "Created At",
    render: (v: any) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
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
      itemId={item?.teamCategoryId}
      fetchFn={fetchFn}
      fields={fields as any}
      title="View Team Category"
    />
  );
}
