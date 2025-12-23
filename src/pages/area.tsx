import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import type { Area } from "@/types/area";
import AreaTable from "@/components/view/area/area-table";
import AreaFormModal from "@/components/view/area/area-form-modal";
import AreaViewModal from "@/components/view/area/area-view-modal";
import { Button } from "@/components/ui/button";
import AreaExcelUpload from "@/components/view/area/area-excel-upload";

export default function AreaPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Area>();
  const [viewData, setViewData] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [excelOpen, setExcelOpen] = useState(false);

  const bumpRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const openView = (row: Area) => {
    setViewData(row.areaId);
    setViewOpen(true);
  };

  const openForm = (row?: Area) => {
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
            Area Management
          </h1>
          <p className="text-gray-500 mt-2">Manage all facility areas</p>
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
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Area
          </Button>
        </div>
      </div>

      <div className="rounded-lg">
        <AreaTable
          onView={openView}
          onEdit={openForm}
          refreshKey={refreshKey}
        />
      </div>

      <AreaFormModal
        isOpen={formOpen}
        initialData={editRow}
        onClose={() => {
          setFormOpen(false);
          setEditRow(undefined);
        }}
        onSave={handleSaved}
      />

      <AreaViewModal
        isOpen={viewOpen}
        areaId={viewData}
        onClose={() => {
          setViewOpen(false);
          setViewData(undefined);
        }}
      />

      <AreaExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={() => {
          handleSaved();
        }}
      />
    </div>
  );
}
