"use client";

import { useState } from "react";
import type { DebitNote } from "@/types/debitNote";
import DebitNoteTable from "@/components/view/debitNote/debitNote-table";
import DebitNoteViewModal from "@/components/view/debitNote/debitNote-view-modal";

export default function DebitNote() {

  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<DebitNote | null>(null);

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const bumpRefresh = () => setRefreshKey((s) => s + 1);

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

      {/* Table */}
      <DebitNoteTable
        onView={openView}
        refreshKey={refreshKey}
      />

      {/* View Modal */}
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
