import { useState } from "react";
import ParkingTable from "@/components/view/parking/parking-table";
import ParkingFormModal from "@/components/view/parking/parking-form-modal";
import ParkingViewModal from "@/components/view/parking/parking-view-modal";
import type { Parking } from "@/types/parking";
import { Button } from "@/components/ui/button";

export default function ParkingPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewItem, setViewItem] = useState<Parking | null>(null);
  const [editItem, setEditItem] = useState<Parking | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Parking</h2>
        <div>
          <Button
            className="btn"
            onClick={() => {
              setEditItem(null);
              setFormOpen(true);
            }}
          >
            Add Parking
          </Button>
        </div>
      </div>

      <ParkingTable
        onView={(row) => {
          setViewItem(row);
          setViewOpen(true);
        }}
        onEdit={(row) => {
          setEditItem(row);
          setFormOpen(true);
        }}
        refreshKey={refreshKey}
      />

      <ParkingFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditItem(null);
          setRefreshKey((k) => k + 1);
        }}
        initialData={editItem ?? undefined}
        onSaved={() => setRefreshKey((k) => k + 1)}
      />

      <ParkingViewModal
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewItem(null);
        }}
        item={viewItem}
      />
    </div>
  );
}
