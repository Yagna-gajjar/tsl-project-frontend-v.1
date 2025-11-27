"use client";

import { useState } from "react";
import FamilyTable from "@/components/view/family/family-table";
import FamilyFormModal from "@/components/view/family/family-form-modal";
import FamilyViewModal from "@/components/view/family/family-view-modal";
import type { Family } from "@/types/family";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function FamilyPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<Family | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Family | null>(null);

  // increment this to trigger table refresh
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const bumpRefresh = () => setRefreshKey((s) => s + 1);

  const openView = (row: Family) => {
    setViewData(row);
    setViewOpen(true);
  };

  const openForm = (row?: Family | null) => {
    setEditRow(row ?? null);
    setFormOpen(true);
  };

  return (
    <div className="container mx-auto px-4 space-y-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Family Management</h1>
          <p className="text-muted-foreground">
            Manage all families in your system using a dynamic table.
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-5 h-5" />
          Add Family
        </Button>
      </div>

      <FamilyTable
        onOpenView={openView}
        onOpenForm={openForm}
        refreshKey={refreshKey}
      />

      <FamilyViewModal
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewData(null);
        }}
        item={viewData}
      />

      <FamilyFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        initialData={editRow}
        onSaved={() => {
          bumpRefresh();
        }}
      />
    </div>
  );
}
