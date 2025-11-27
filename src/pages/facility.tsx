"use client";

import { useState } from "react";
import FacilityTable from "@/components/view/facility/facility-table";
import FacilityFormModal from "@/components/view/facility/facility-form-modal";
import FacilityViewModal from "@/components/view/facility/facility-view-modal";
import type { Facility } from "@/types/facility";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function FacilityPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<Facility | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Facility | null>(null);

  // increment this to trigger table refresh
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const bumpRefresh = () => setRefreshKey((s) => s + 1);

  const openView = (row: Facility) => {
    setViewData(row);
    setViewOpen(true);
  };

  const openForm = (row?: Facility | null) => {
    setEditRow(row ?? null);
    setFormOpen(true);
  };

  return (
    <div className="container mx-auto px-4 space-y-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Facility Management</h1>
          <p className="text-muted-foreground">
            Manage all facilities in your system using a dynamic table.
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-5 h-5" />
          Add Facility
        </Button>
      </div>

      <FacilityTable
        onView={openView}
        onEdit={openForm}
        refreshKey={refreshKey}
      />

      <FacilityViewModal
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewData(null);
        }}
        item={viewData}
      />

      <FacilityFormModal
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
