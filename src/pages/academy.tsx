import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import type { Academy } from "@/types/academy";
import AcademyTable from "@/components/view/academy/academy-table";
import AcademyFormModal from "@/components/view/academy/academy-form-modal";
import AcademyViewModal from "@/components/view/academy/academy-view-modal";
import AcademyExcelUpload from "@/components/view/academy/academy-excel-upload";
import { Button } from "@/components/ui/button";

export default function AcademyPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [excelOpen, setExcelOpen] = useState(false);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Academy Management
          </h1>
          <p className="text-gray-500 mt-2">Manage all academies</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setExcelOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <Upload className="w-5 h-5" />
            Upload Excel
          </Button>

          <Button
            size="lg"
            onClick={() => openForm()}
            className="flex items-center gap-2 px-4 py-2"
          >
            <Plus className="w-5 h-5" />
            Add Academy
          </Button>
        </div>
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

      <AcademyExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={() => {
          handleSaved();
        }}
      />
    </div>
  );
}