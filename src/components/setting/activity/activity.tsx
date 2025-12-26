import { useState } from "react";
import ActivityTable from "./activity-table";
import { ActivityFormModal } from "./activity-form-modal";
import ActivityViewModal from "./activity-view-modal";
import type { Activity } from "@/types/activity";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import ActivityExcelUpload from "./activity-excel-upload";

export default function ActivityPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<Activity | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Activity | null>(null);

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [excelOpen, setExcelOpen] = useState(false);
  const bumpRefresh = () => setRefreshKey((s) => s + 1);

  const handleSaved = () => {
    bumpRefresh();
  };
  const openView = (row: Activity) => {
    setViewData(row);
    setViewOpen(true);
  };

  const openForm = (row?: Activity | null) => {
    setEditRow(row ?? null);
    setFormOpen(true);
  };

  return (
    <div className="container mx-auto px-4 space-y-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Activity Management</h1>
          <p className="text-muted-foreground">
            Manage all activities in your system using a dynamic table.
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
          <Button
            onClick={() => openForm(null)}
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium shadow-sm bg-primary text-white hover:opacity-90"
            type="button"
          >
            Add Activity
          </Button>
        </div>
      </div>

      <ActivityTable
        onView={openView}
        onEdit={openForm}
        refreshKey={refreshKey}
      />

      <ActivityViewModal
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewData(null);
        }}
        item={viewData}
      />

      <ActivityFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        initialData={editRow}
        onSaved={() => {
          bumpRefresh();
        }}
      />

      <ActivityExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={() => { handleSaved(); }}
      />
    </div>
  );
}
