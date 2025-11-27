import { useState } from "react";
import { Plus } from "lucide-react";
import type { AcademyCoach } from "@/types/academyCoach";
import AcademyCoachTable from "@/components/view/academyCoach/academyCoach-table";
import AcademyCoachFormModal from "@/components/view/academyCoach/academyCoach-form-modal";
import AcademyCoachViewModal from "@/components/view/academyCoach/academyCoach-view-modal";
import { Button } from "@/components/ui/button";

export default function AcademyCoachPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<AcademyCoach>();
  const [viewData, setViewData] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const openView = (row: AcademyCoach) => {
    setViewData(row.academyCoachesId);
    setViewOpen(true);
  };

  const openForm = (row?: AcademyCoach) => {
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
          <h1 className="text-3xl font-bold text-gray-900">
            Academy Coaches Management
          </h1>
          <p className="text-gray-500 mt-2">Manage academy coaches</p>
        </div>

        <Button
          size="lg"
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-5 h-5" />
          Add Academy Coach
        </Button>
      </div>

      <div className="bg-white rounded-lg">
        <AcademyCoachTable
          onView={openView}
          onEdit={openForm}
          refreshKey={refreshKey}
        />
      </div>

      <AcademyCoachFormModal
        isOpen={formOpen}
        initialData={editRow}
        onClose={() => {
          setFormOpen(false);
          setEditRow(undefined);
        }}
        onSave={handleSaved}
      />

      <AcademyCoachViewModal
        isOpen={viewOpen}
        academyCoachesId={viewData}
        onClose={() => {
          setViewOpen(false);
          setViewData(undefined);
        }}
      />
    </div>
  );
}
