"use client";

import React, { useState } from "react";
import IdentityTypeTable from "./identity-type-table";
import IdentityTypeViewModal from "./identity-type-view-modal";
import IdentityTypeFormModal from "./identity-type-form-modal";
import type { IdentityType } from "@/types/identityType";
import { Button } from "@/components/ui/button";

export default function IdentityTypePage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<IdentityType | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<IdentityType | null>(null);

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const bump = () => setRefreshKey((s) => s + 1);

  const openView = (row: IdentityType) => {
    setViewData(row);
    setViewOpen(true);
  };
  const openForm = (row?: IdentityType | null) => {
    setEditRow(row ?? null);
    setFormOpen(true);
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Identity Types</h2>
        <div className="flex gap-2">
          <Button onClick={() => openForm(null)}>
            Add Identity Type
          </Button>
        </div>
      </div>

      <IdentityTypeTable
        refreshKey={refreshKey}
        onView={openView}
        onEdit={openForm}
      />

      <IdentityTypeViewModal
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewData(null);
        }}
        item={viewData}
      />

      <IdentityTypeFormModal
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
