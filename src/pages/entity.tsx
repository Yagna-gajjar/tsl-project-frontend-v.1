import { useState } from "react";
import { Plus } from "lucide-react";
import type { Entity } from "@/types/entity";
import EntityTable from "@/components/view/entity/entity-table";
import EntityFormModal from "@/components/view/entity/entity-form-modal";
import EntityViewModal from "@/components/view/entity/entity-view-modal";
import { Button } from "@/components/ui/button";

export default function EntityPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editRow, setEditRow] = useState<Entity>();
  const [viewId, setViewId] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Entity Management</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Entity
        </Button>
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
    </div>
  );
}
