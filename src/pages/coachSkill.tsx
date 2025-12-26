import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import type { CoachSkill } from "@/types/coachSkill";
import CoachSkillTable from "@/components/view/coachSkill/coachSkill-table";
import CoachSkillFormModal from "@/components/view/coachSkill/coachSkill-form-modal";
import CoachSkillViewModal from "@/components/view/coachSkill/coachSkill-view-modal";
import { Button } from "@/components/ui/button";
import CoachSkillExcelUpload from "@/components/view/coachSkill/coachSkill-excel-upload";

export default function CoachSkillPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<CoachSkill>();
  const [viewData, setViewData] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [excelOpen, setExcelOpen] = useState(false);

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
            <Plus className="w-4 h-4 mr-2" /> Add CoachSkill
          </Button>
        </div>
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

      <CoachSkillExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={() => {
          handleSaved();
        }}
      />
    </div>
  );
}
