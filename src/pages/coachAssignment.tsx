import { useState } from "react";
import CoachAssignmentTable from "@/components/view/coachAssignment/coachAssignment-table";
import CoachAssignmentFormModal from "@/components/view/coachAssignment/coachAssignment-form-modal";
import CoachAssignmentViewModal from "@/components/view/coachAssignment/coachAssignment-view-modal";
import { Button } from "@/components/ui/button";
import type { CoachAssignment } from "@/types/coachAssignment";
import { Upload } from "lucide-react";
import CoachAssignmentExcelUpload from "@/components/view/coachAssignment/coachAssignment-excel-upload";

export default function CoachAssignmentsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editing, setEditing] = useState<CoachAssignment | undefined>(
    undefined
  );
  const [viewingId, setViewingId] = useState<number | undefined>(undefined);
  const [excelOpen, setExcelOpen] = useState(false);

  const bumpRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSaved = () => {
    bumpRefresh();
  }

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
          <Button
            variant="outline"
            size="lg"
            onClick={() => setExcelOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <Upload className="w-5 h-5" />
            Upload Excel
          </Button>
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

      <CoachAssignmentExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={() => {
          handleSaved();
        }}
      />
    </div>
  );
}
