"use client";

import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { DebitNote } from "@/types/debitNote";
import { Tag, Calendar, User, FileText, CreditCard, Hash } from "lucide-react";
import type { FieldConfig } from "@/components/view-modal/types";

type Props = {
  isOpen: boolean;
  item?: DebitNote | null;
  onClose: () => void;
};

const fields: FieldConfig<DebitNote>[] = [
  { key: "debitNoteId", label: "Debit Note ID", icon: Hash },

  {
    key: "debitNoteDate",
    label: "Date",
    icon: Calendar,
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },

  { key: "debitNoteType", label: "Type", icon: Tag },

  {
    key: "coachId",
    label: "Coach ID",
    icon: User,
    render: (v:any) => v ?? "N/A",
  },

  {
    key: "enrollmentId",
    label: "Enrollment ID",
    icon: FileText,
    render: (v:any) => v ?? "N/A",
  },

  {
    key: "debitNoteAmount",
    label: "Amount",
    icon: CreditCard,
    render: (v:any) =>
      typeof v === "number" ? `₹${v.toLocaleString("en-IN")}` : v ?? "-",
  },

  {
    key: "debitNoteRemarks",
    label: "Remarks",
    icon: FileText,
    render: (v) => (v ? String(v) : "-"),
  },

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

export default function DebitNoteViewModal({
  isOpen,
  item,
  onClose,
}: Props) {
  const fetchFn = useCallback(
    async (_?: number | string) => {
      if (!item) throw new Error("No data");
      return item;
    },
    [item]
  );

  return (
    <ViewModal<DebitNote>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(item?.debitNoteId)}
      fetchFn={fetchFn as any}
      fields={fields}
      title="View Debit Note"
      layout="grid"
    />
  );
}
