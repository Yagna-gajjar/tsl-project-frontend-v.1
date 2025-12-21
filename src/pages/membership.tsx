import { useState } from "react";
import MembershipTable from "@/components/view/membership/membership-table";
import MembershipFormModal from "@/components/view/membership/membership-form-modal";
import MembershipViewModal from "@/components/view/membership/membership-view-modal";
import type { membership } from "@/types/membership";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import MembershipInstanceExcelUpload from "@/components/view/membership/membership-excel-upload";

export default function MembershipPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);

  const [excelOpen, setExcelOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<membership | null>(null);

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const bumpRefresh = () => setRefreshKey((s) => s + 1);

  const openView = (row: membership) => {
    setViewId(row.membershipId ?? null);
    setViewOpen(true);
  };

  const handleSaved = () => {
    bumpRefresh();
  };


  const openForm = (row?: membership | null) => {
    setEditRow(row ?? null);
    setFormOpen(true);
  };

  return (
    <div className="container mx-auto px-4 space-y-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Memberships</h1>
          <p className="text-muted-foreground">
            Create, edit and view memberships.
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

          <Button
            size="lg"
            onClick={() => openForm()}
            className="flex items-center gap-2 px-4 py-2"
          >
            <Plus className="w-5 h-5" />
            Add Membership
          </Button>
        </div>
      </div>

      <MembershipTable
        onView={openView}
        onEdit={openForm}
        refreshKey={refreshKey}
      />

      <MembershipViewModal
        isOpen={viewOpen}
        membershipId={viewId ?? undefined}
        onClose={() => {
          setViewOpen(false);
          setViewId(null);
        }}
      />

      <MembershipFormModal
        isOpen={formOpen}
        initialData={editRow ?? undefined}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          bumpRefresh();
        }}
      />

      <MembershipInstanceExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={() => {
          handleSaved();
        }}
      />
    </div>
  );
}
