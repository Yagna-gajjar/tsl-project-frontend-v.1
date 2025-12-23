import { useState } from "react";
import AuthorityTable from "@/components/view/authority/authority-table";
import AuthorityFormModal from "@/components/view/authority/authority-form-modal";
import AuthorityViewModal from "@/components/view/authority/authority-view-modal";
import type { Authority } from "@/types/authority";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import AuthorityExcelUpload from "@/components/view/authority/authority-excel-upload";

export default function AuthorityPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editRow, setEditRow] = useState<Authority | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [excelOpen, setExcelOpen] = useState(false);
  const bumpRefresh = () => setRefresh((s) => s + 1);

  const handleSaved = () => {
    bumpRefresh();
  };
  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Authority Management</h1>
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
            <Plus className="w-4 h-4 mr-2" /> Add Authority
          </Button>
        </div>
      </div>
      <AuthorityTable
        refreshKey={refresh}
        onEdit={(r) => {
          setEditRow(r);
          setFormOpen(true);
        }}
        onView={(r) => {
          setViewId(r.authorityId!);
          setViewOpen(true);
        }}
      />

      <AuthorityFormModal
        isOpen={formOpen}
        initialData={editRow ?? undefined}
        onClose={() => {
          setFormOpen(false);
          setEditRow(null);
        }}
        onSave={() => setRefresh((v) => v + 1)}
      />

      <AuthorityViewModal
        isOpen={viewOpen}
        authorityId={Number(viewId)}
        onClose={() => setViewOpen(false)}
      />

      <AuthorityExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={() => {
          handleSaved();
        }}
      />
    </div>
  );
}
