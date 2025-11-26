import { useState } from "react";
import { Plus } from "lucide-react";
import type { Coach } from "@/types/coach";
import CoachTable from "../components/coach/coach-table";
import CoachFormModal from "../components/coach/coach-form-modal";
import CoachViewModal from "../components/coach/coach-view-modal";

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
          <h1 className="text-3xl font-bold text-gray-900">Coach Management</h1>
          <p className="text-gray-500 mt-2">Manage all coaches</p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Coach
        </button>
      </div>

      <div className="bg-white rounded-lg">
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
