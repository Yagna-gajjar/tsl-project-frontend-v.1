import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import type { Entity } from "@/types/entity";
import EntityTable from "@/components/view/entity/entity-table";
import EntityFormModal from "@/components/view/entity/entity-form-modal";
import EntityViewModal from "@/components/view/entity/entity-view-modal";
import { Button } from "@/components/ui/button";
import EntityExcelUpload from "@/components/view/entity/entity-excel-upload";

export default function EntityPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editRow, setEditRow] = useState<Entity>();
  const [viewId, setViewId] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [excelOpen, setExcelOpen] = useState(false);
  const bumpRefresh = () => setRefreshKey((s) => s + 1);

  const handleSaved = () => {
    bumpRefresh();
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Entity Management</h1>
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
            <Plus className="w-4 h-4 mr-2" /> Add Entity
          </Button>
        </div>
      </div>

      <EntityTable
        refreshKey={refreshKey}
        onEdit={(r) => {
          setEditRow(r);
          setFormOpen(true);
        }}
        onView={(r) => {
          setViewId(r.entityId);
          setViewOpen(true);
        }}
      />

      <EntityFormModal
        isOpen={formOpen}
        initialData={editRow}
        onClose={() => {
          setFormOpen(false);
          setEditRow(undefined);
        }}
        onSave={() => setRefreshKey((p) => p + 1)}
      />

      <EntityViewModal
        isOpen={viewOpen}
        entityId={viewId}
        onClose={() => setViewOpen(false)}
      />

      <EntityExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={() => {
          handleSaved();
        }}
      />
    </div>
  );
}
