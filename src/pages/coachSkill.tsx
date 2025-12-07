import { useState } from "react";
import { Plus } from "lucide-react";
import type { CoachSkill } from "@/types/coachSkill";
import CoachSkillTable from "@/components/view/coachSkill/coachSkill-table";
import CoachSkillFormModal from "@/components/view/coachSkill/coachSkill-form-modal";
import CoachSkillViewModal from "@/components/view/coachSkill/coachSkill-view-modal";
import { Button } from "@/components/ui/button";

export default function CoachSkillPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<CoachSkill>();
  const [viewData, setViewData] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const openView = (row: CoachSkill) => {
    setViewData(row.coachSkillId);
    setViewOpen(true);
  };

  const openForm = (row?: CoachSkill) => {
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
          <h1 className="text-3xl font-bold text-foreground">
            Coach Skills Management
          </h1>
          <p className="text-gray-500 mt-2">
            Manage coach skills and expertise
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-5 h-5" />
          Add Coach Skill
        </Button>
      </div>

      <div className="rounded-lg">
        <CoachSkillTable
          onView={openView}
          onEdit={openForm}
          refreshKey={refreshKey}
        />
      </div>

      <CoachSkillFormModal
        isOpen={formOpen}
        initialData={editRow}
        onClose={() => {
          setFormOpen(false);
          setEditRow(undefined);
        }}
        onSave={handleSaved}
      />

      <CoachSkillViewModal
        isOpen={viewOpen}
        coachSkillId={viewData}
        onClose={() => {
          setViewOpen(false);
          setViewData(undefined);
        }}
      />
    </div>
  );
}
