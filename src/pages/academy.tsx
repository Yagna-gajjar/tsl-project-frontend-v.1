import { useState } from "react";
import { Plus } from "lucide-react";
import type { Academy } from "@/types/academy";
import AcademyTable from "@/components/view/academy/academy-table";
import AcademyFormModal from "@/components/view/academy/academy-form-modal";
import AcademyViewModal from "@/components/view/academy/academy-view-modal";
import { Button } from "@/components/ui/button";

export default function AcademyPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Academy>();
  const [viewData, setViewData] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const openView = (row: Academy) => {
    setViewData(row.academyId);
    setViewOpen(true);
  };

  const openForm = (row?: Academy) => {
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
            Academy Management
          </h1>
          <p className="text-gray-500 mt-2">Manage all academies</p>
        </div>

        <Button
          size="lg"
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-5 h-5" />
          Add Academy
        </Button>
      </div>

      <div className="rounded-lg">
        <AcademyTable
          onView={openView}
          onEdit={openForm}
          refreshKey={refreshKey}
        />
      </div>

      <AcademyFormModal
        isOpen={formOpen}
        initialData={editRow}
        onClose={() => {
          setFormOpen(false);
          setEditRow(undefined);
        }}
        onSave={handleSaved}
      />

      <AcademyViewModal
        isOpen={viewOpen}
        academyId={viewData}
        onClose={() => {
          setViewOpen(false);
          setViewData(undefined);
        }}
      />
    </div>
  );
}
