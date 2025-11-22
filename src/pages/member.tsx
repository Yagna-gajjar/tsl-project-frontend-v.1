"use client";

import React, { useState } from "react";
import MemberTable from "@/components/members/member-table";
import MemberFormModal from "@/components/members/member-form-modal";
import MemberViewModal from "@/components/members/member-view-modal";
import type { Member } from "@/types/member";

export default function MemberPage() {
  // Read familyId from URL (safe to run in client)
  const queryParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const familyId = queryParams.get("familyId");
  const initialFamilyId = familyId ? Number(familyId) : undefined;

  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Member | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<Member | null>(null);

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const bumpRefresh = () => setRefreshKey((s) => s + 1);

  const openForm = (row?: Member | null) => {
    setEditRow(row ?? null);
    setFormOpen(true);
  };

  const openView = (row: Member) => {
    setViewData(row);
    setViewOpen(true);
  };

  return (
    <div className="mx-auto px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground">Manage all members.</p>
        </div>

        <button
          className="px-4 py-2 bg-primary text-white rounded-md"
          onClick={() => openForm(null)}
        >
          Add Member
        </button>
      </div>

      {/* Pass initialFamilyId and handlers to table (table no longer renders the view modal) */}
      <MemberTable
        onOpenForm={openForm}
        onOpenView={openView}
        refreshKey={refreshKey}
        initialFamilyId={initialFamilyId}
      />

      <MemberFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        initialData={editRow}
        onSaved={() => {
          bumpRefresh();
        }}
      />

      {/* Page-level Member view modal */}
      <MemberViewModal
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
