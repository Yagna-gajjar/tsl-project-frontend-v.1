import { useState } from "react";
import FacilityTable from "@/components/view/facility/facility-table";
import FacilityFormModal from "@/components/view/facility/facility-form-modal";
import FacilityViewModal from "@/components/view/facility/facility-view-modal";
import type { Facility } from "@/types/facility";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import FacilityExcelUpload from "@/components/view/facility/facility-excel-upload";

export default function FacilityPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<Facility | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Facility | null>(null);

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [excelOpen, setExcelOpen] = useState(false);
  const bumpRefresh = () => setRefreshKey((s) => s + 1);

  const openView = (row: Facility) => {
    setViewData(row);
    setViewOpen(true);
  };

  const openForm = (row?: Facility | null) => {
    setEditRow(row ?? null);
    setFormOpen(true);
  };

  const handleSaved = () => {
    bumpRefresh();
  };

  return (
    <div className="container mx-auto px-4 space-y-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Facility Management</h1>
          <p className="text-muted-foreground">
            Manage all facilities in your system using a dynamic table.
          </p>
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
            <Plus className="w-4 h-4 mr-2" /> Add Facility
          </Button>
        </div>
      </div>

      <FacilityTable
        onView={openView}
        onEdit={openForm}
        refreshKey={refreshKey}
      />

      <FacilityViewModal
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewData(null);
        }}
        item={viewData}
      />

      <FacilityFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        initialData={editRow}
        onSaved={() => {
          bumpRefresh();
        }}
      />

      <FacilityExcelUpload
              isOpen={excelOpen}
              onClose={() => setExcelOpen(false)}
              onSuccess={() => {
                handleSaved();
              }}
            />
    </div>
  );
}
