import { useState } from "react";
import MemberTable from "@/components/view/members/member-table";
import MemberFormModal from "@/components/view/members/member-form-modal";
import MemberViewModal from "@/components/view/members/member-view-modal";
import type { Member } from "@/types/member";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import MemberExcelUpload from "@/components/view/members/member-excel-upload";

export default function MemberPage() {
  const queryParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const familyId = queryParams.get("familyId");
  const initialFamilyId = familyId ? Number(familyId) : undefined;
  const [excelOpen, setExcelOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Member | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<Member | null>(null);

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const bumpRefresh = () => setRefreshKey((s) => s + 1);

  const handleSaved = () => {
    bumpRefresh();
  };

  const openForm = (row?: Member | null) => {
    setEditRow(row ?? null);
    setFormOpen(true);
  };

  const openView = (row: Member) => {
    setViewData(row);
    setViewOpen(true);
  };

  return (
    <div className="mx-auto px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground">Manage all members.</p>
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
            size="lg"
            onClick={() => openForm()}
            className="flex items-center gap-2 px-4 py-2"
          >
            <Plus className="w-5 h-5" />
            Add Member
          </Button>
        </div>
      </div>

      <MemberTable
        onOpenForm={openForm}
        onOpenView={openView}
        refreshKey={refreshKey}
        initialFamilyId={initialFamilyId}
      />

      <MemberFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        initialData={editRow ? editRow : {}}
        onSaved={() => {
          bumpRefresh();
        }}
      />

      <MemberViewModal
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewData(null);
        }}
        item={viewData}
      />

      <MemberExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={() => {
          handleSaved();
        }}
      />
    </div>
  );
}
