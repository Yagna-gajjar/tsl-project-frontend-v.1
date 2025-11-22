"use client";

import React, { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { Member } from "@/types/member";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item?: Member | null;
};

const defaultFields = [
  { key: "memberId", label: "ID" },
  { key: "memberFirstName", label: "First Name" },
  { key: "memberMiddleName", label: "Middle Name" },
  { key: "memberLastName", label: "Last Name" },
  {
    key: "dob",
    label: "DOB",
    render: (v: any) => (v ? new Date(v).toLocaleDateString() : "-"),
  },
  { key: "email", label: "Email" },
  { key: "contactNumber", label: "Contact" },
  { key: "gender", label: "Gender" },
  { key: "relationship", label: "Relationship" },
  { key: "bloodGroup", label: "Blood Group" },
  { key: "transportMode", label: "Transport Mode" },
  { key: "status", label: "Status" },
  { key: "remarks", label: "Remarks" },
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

export default function MemberViewModal({ isOpen, onClose, item }: Props) {
  const fetchFn = useCallback(
    async (id?: number | string) => {
      if (!item) throw new Error("No data");
      return item;
    },
    [item]
  );

  return (
    <ViewModal<Member>
      isOpen={isOpen}
      onClose={onClose}
      itemId={item?.memberId}
      fetchFn={fetchFn}
      fields={defaultFields as any}
      title="View Member"
    />
  );
}
