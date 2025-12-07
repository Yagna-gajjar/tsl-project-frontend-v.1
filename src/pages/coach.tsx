import { useState } from "react";
import { Plus } from "lucide-react";
import type { Coach } from "@/types/coach";
import CoachTable from "@/components/view/coach/coach-table";
import CoachFormModal from "@/components/view/coach/coach-form-modal";
import CoachViewModal from "@/components/view/coach/coach-view-modal";
import { Button } from "@/components/ui/button";

export default function CoachPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Coach>();
  const [viewData, setViewData] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const openView = (row: Coach) => {
    setViewData(row.coachId);
    setViewOpen(true);
  };

  const openForm = (row?: Coach) => {
    setEditRow(row);
    setFormOpen(true);
  };

  const handleSaved = () => {
    bumpRefresh();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Coach Management
          </h1>
          <p className="text-gray-500 mt-2">Manage all coaches</p>
        </div>

        <Button
          size="lg"
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-5 h-5" />
          Add Coach
        </Button>
      </div>

      <div className="rounded-lg">
        <CoachTable
          onView={openView}
          onEdit={openForm}
          refreshKey={refreshKey}
        />
      </div>

      <CoachFormModal
        isOpen={formOpen}
        initialData={editRow}
        onClose={() => {
          setFormOpen(false);
          setEditRow(undefined);
        }}
        onSave={handleSaved}
      />

      <CoachViewModal
        isOpen={viewOpen}
        coachId={viewData}
        onClose={() => {
          setViewOpen(false);
          setViewData(undefined);
        }}
      />
    </div>
  );
}
