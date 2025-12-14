import { useState } from "react";
import BatchConnectionTable from "@/components/view/batchConnection/batchConnection-table";
import BatchConnectionFormModal from "@/components/view/batchConnection/batchConnection-form-modal";
import BatchConnectionViewModal from "@/components/view/batchConnection/batchConnection-view-modal";
import { Button } from "@/components/ui/button";
import type { BatchConnection } from "@/types/batchConnection";

export default function BatchConnectionsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editing, setEditing] = useState<BatchConnection | undefined>(
    undefined
  );
  const [viewingId, setViewingId] = useState<number | undefined>(undefined);

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Batch Connections</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setRefreshKey((k) => k + 1);
            }}
          >
            Refresh
          </Button>
          <Button onClick={openCreate}>New Connection</Button>
        </div>
      </div>

      <BatchConnectionTable
        refreshKey={refreshKey}
        onEdit={(row) => {
          setEditing(row);
          setFormOpen(true);
        }}
        onView={(row) => {
          setViewingId(row.batchConnectionId);
          setViewOpen(true);
        }}
      />

      <BatchConnectionFormModal
        isOpen={formOpen}
        initialData={editing}
        onClose={() => setFormOpen(false)}
        onSave={() => {
          setFormOpen(false);
          setRefreshKey((k) => k + 1);
        }}
      />

      <BatchConnectionViewModal
        isOpen={viewOpen}
        batchConnectionId={viewingId}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
}
