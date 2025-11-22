"use client";

import React, { useState } from "react";
import TeamCategoryTable from "./team-category-table";
import TeamCategoryViewModal from "./team-category-view-modal";
import TeamCategoryFormModal from "./team-category-form-modal";
import type { TeamCategory } from "@/types/teamCategory";
import { Button } from "@/components/ui/button";

export default function TeamCategoryPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<TeamCategory | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<TeamCategory | null>(null);

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const bump = () => setRefreshKey((s) => s + 1);

  const openView = (row: TeamCategory) => {
    setViewData(row);
    setViewOpen(true);
  };

  const openForm = (row?: TeamCategory | null) => {
    setEditRow(row ?? null);
    setFormOpen(true);
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Team Categories</h2>
        <div className="flex gap-2">
          <Button onClick={() => openForm(null)}>Add Team Category</Button>
        </div>
      </div>

      <TeamCategoryTable
        onView={openView}
        onEdit={openForm}
        refreshKey={refreshKey}
      />

      <TeamCategoryViewModal
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewData(null);
        }}
        item={viewData}
      />

      <TeamCategoryFormModal
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
