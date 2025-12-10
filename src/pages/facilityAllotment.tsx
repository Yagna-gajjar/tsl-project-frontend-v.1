import { useState } from "react";
import FacilityAllotmentTable from "@/components/view/facilityAllotment/facilityAllotmwnt-table";
import FacilityAllotmentFormModal from "@/components/view/facilityAllotment/facility-form-modal";
import FacilityAllotmentViewModal from "@/components/view/facilityAllotment/facility-view-modal";
import { Button } from "@/components/ui/button";
import type { FacilityAllotment } from "@/types/facilityAllotment";

export default function FacilityAllotmentsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editing, setEditing] = useState<FacilityAllotment | undefined>(
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
        <h2 className="text-xl font-semibold">Facility Allotments</h2>
        <div className="flex items-center gap-2">
          <Button onClick={() => setRefreshKey((k) => k + 1)}>Refresh</Button>
          <Button onClick={openCreate}>New Allotment</Button>
        </div>
      </div>

      <FacilityAllotmentTable
        refreshKey={refreshKey}
        onEdit={(row) => {
          setEditing(row);
          setFormOpen(true);
        }}
        onView={(row) => {
          setViewingId(row.facilityAllotmentId);
          setViewOpen(true);
        }}
      />

      <FacilityAllotmentFormModal
        isOpen={formOpen}
        initialData={editing}
        onClose={() => setFormOpen(false)}
        onSave={() => {
          setFormOpen(false);
          setRefreshKey((k) => k + 1);
        }}
      />

      <FacilityAllotmentViewModal
        isOpen={viewOpen}
        facilityAllotmentId={viewingId}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
}
