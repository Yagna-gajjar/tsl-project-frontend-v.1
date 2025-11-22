"use client";

import React, { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { FamilyType } from "@/types/familyType";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item?: FamilyType | null;
};

const fields = [
  { key: "familyTypeId", label: "ID" },
  { key: "familyTypeName", label: "Family Type" },
  { key: "prefix", label: "Prefix" },
  { key: "maxMembers", label: "Max Members" },
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

export default function FamilyTypeViewModal({ isOpen, onClose, item }: Props) {
  const fetchFn = useCallback(
    async (id?: number | string) => {
      if (!item) throw new Error("No data");
      return item;
    },
    [item]
  );

  return (
    <ViewModal<FamilyType>
      isOpen={isOpen}
      onClose={onClose}
      itemId={item?.familyTypeId}
      fetchFn={fetchFn}
      fields={fields as any}
      title="View Family Type"
    />
  );
}
