import { useState } from "react";
import { Plus } from "lucide-react";
import type { Area } from "@/types/area";
import AreaTable from "@/components/view/area/area-table";
import AreaFormModal from "@/components/view/area/area-form-modal";
import AreaViewModal from "@/components/view/area/area-view-modal";
import { Button } from "@/components/ui/button";

export default function AreaPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Area>();
  const [viewData, setViewData] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);

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
          <h1 className="text-3xl font-bold text-gray-900">Area Management</h1>
          <p className="text-gray-500 mt-2">Manage all facility areas</p>
        </div>
        <Button
          size="lg"
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-5 h-5" />
          Add Area
        </Button>
      </div>

      <div className="bg-white rounded-lg">
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
    </div>
  );
}
