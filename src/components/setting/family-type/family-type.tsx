"use client";

import React, { useState } from "react";
import FamilyTypeTable from "./family-type-table";
import FamilyTypeViewModal from "./family-type-view-modal";
import FamilyTypeFormModal from "./family-type-form-modal";
import type { FamilyType } from "@/types/familyType";
import { Button } from "@/components/ui/button";

export default function FamilyTypePage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<FamilyType | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<FamilyType | null>(null);

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const bump = () => setRefreshKey((s) => s + 1);

  const openView = (row: FamilyType) => {
    setViewData(row);
    setViewOpen(true);
  };

  const openForm = (row?: FamilyType | null) => {
    setEditRow(row ?? null);
    setFormOpen(true);
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Family Types</h2>
        <div className="flex gap-2">
          <Button onClick={() => openForm(null)}>
            Add Family Type
          </Button>
        </div>
      </div>

      <FamilyTypeTable
        onView={openView}
        onEdit={openForm}
        refreshKey={refreshKey}
      />

      <FamilyTypeViewModal
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewData(null);
        }}
        item={viewData}
      />

      <FamilyTypeFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        initialData={editRow}
        onSaved={() => {
          bump();
        }}
      />
    </div>
  );
}
