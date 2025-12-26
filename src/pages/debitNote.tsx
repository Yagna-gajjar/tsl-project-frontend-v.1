import { useState } from "react";
import type { DebitNote } from "@/types/debitNote";
import DebitNoteTable from "@/components/view/debitNote/debitNote-table";
import DebitNoteViewModal from "@/components/view/debitNote/debitNote-view-modal";

export default function DebitNote() {

  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<DebitNote | null>(null);


  const openView = (row: DebitNote) => {
    setViewData(row);
    setViewOpen(true);
  };

  return (
    <div className="mx-auto px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Debit Note</h1>
          <p className="text-muted-foreground">Manage all Debit Notes.</p>
        </div>
      </div>

      <DebitNoteTable onView={openView} />

      <DebitNoteViewModal
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewData(null);
        }}
        item={viewData}
      />
    </div>
  );
}
