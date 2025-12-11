// src/app/(admin)/coach-assignments/page.tsx
"use client";

import { useState } from "react";
import CoachAssignmentTable from "@/components/view/coachAssignment/coachAssignment-table";
import CoachAssignmentFormModal from "@/components/view/coachAssignment/coachAssignment-form-modal";
import CoachAssignmentViewModal from "@/components/view/coachAssignment/coachAssignment-view-modal";
import { Button } from "@/components/ui/button";
import type { CoachAssignment } from "@/types/coachAssignment";

export default function CoachAssignmentsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editing, setEditing] = useState<CoachAssignment | undefined>(
    undefined
  );
  const [viewingId, setViewingId] = useState<number | undefined>(undefined);

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Coach Assignments</h2>
        <div className="flex items-center gap-2">
          <Button onClick={() => setRefreshKey((k) => k + 1)}>Refresh</Button>
          <Button onClick={openCreate}>New Assignment</Button>
        </div>
      </div>

      <CoachAssignmentTable
        refreshKey={refreshKey}
        onEdit={(row) => {
          setEditing(row);
          setFormOpen(true);
        }}
        onView={(row) => {
          setViewingId(row.coachAssignmentId);
          setViewOpen(true);
        }}
      />

      <CoachAssignmentFormModal
        isOpen={formOpen}
        initialData={editing}
        onClose={() => setFormOpen(false)}
        onSave={() => {
          setFormOpen(false);
          setRefreshKey((k) => k + 1);
        }}
      />

      <CoachAssignmentViewModal
        isOpen={viewOpen}
        coachAssignmentId={viewingId}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
}
