import { useState } from "react";
import BatchTable from "@/components/view/batch/batch-table";
import { BatchFormModal } from "@/components/view/batch/batch-form-modal";
import BatchViewModal from "@/components/view/batch/batch-view-modal";
import type { Batch } from "@/types/batch";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import BatchExcelUpload from "@/components/view/batch/batch-excel-upload";

export default function BatchPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<Batch | null>(null);
  const [excelOpen, setExcelOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Batch | null>(null);

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const bumpRefresh = () => setRefreshKey((s) => s + 1);

  const openView = (row: Batch) => {
    setViewData(row);
    setViewOpen(true);
  };

  const openForm = (row?: Batch | null) => {
    setEditRow(row ?? null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditRow(null);
  };

  return (
    <div className="container mx-auto px-4 space-y-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Batch Management</h1>
          <p className="text-muted-foreground">
            Manage all batches in your system using a dynamic table.
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

          <Button onClick={() => openForm(null)}>
            <Plus className="w-4 h-4 mr-2" /> Add Batch
          </Button>
        </div>
      </div>

      <BatchTable onView={openView} onEdit={openForm} refreshKey={refreshKey} />

      <BatchViewModal
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewData(null);
        }}
        item={viewData}
      />

      <BatchFormModal
        isOpen={formOpen}
        onClose={closeForm}
        initialData={editRow}
        onSaved={bumpRefresh}
      />

      <BatchExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={bumpRefresh}
      />
    </div>
  );
}