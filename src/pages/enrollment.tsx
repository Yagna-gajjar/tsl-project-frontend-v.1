import { useState } from "react";
import { Plus } from "lucide-react";
import type { Enrollment } from "@/types/enrollment";
import EnrollmentTable from "@/components/view/enrollment/enrollment-table";
import EnrollmentFormModal from "@/components/view/enrollment-dashboard/enrollment-form-modal";
import EnrollmentViewModal from "@/components/view/enrollment/enrollment-view-modal";
import { Button } from "@/components/ui/button";

export default function EnrollmentPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Enrollment>();
  const [viewData, setViewData] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const openView = (row: Enrollment) => {
    setViewData(row.enrollmentId);
    setViewOpen(true);
  };

  const openForm = (row?: Enrollment) => {
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
          <h1 className="text-3xl font-bold text-gray-900">
            Enrollment Management
          </h1>
          <p className="text-gray-500 mt-2">Manage student enrollments and registrations</p>
        </div>

        <Button
          size="lg"
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-5 h-5" />
          Add Enrollment
        </Button>
      </div>

      <div className="bg-white rounded-lg">
        <EnrollmentTable
          onView={openView}
          onEdit={openForm}
          refreshKey={refreshKey}
        />
      </div>

      <EnrollmentFormModal
        isOpen={formOpen}
        initialData={editRow}
        onClose={() => {
          setFormOpen(false);
          setEditRow(undefined);
        }}
        onSave={handleSaved}
      />

      <EnrollmentViewModal
        isOpen={viewOpen}
        enrollmentId={viewData}
        onClose={() => {
          setViewOpen(false);
          setViewData(undefined);
        }}
      />
    </div>
  );
}
