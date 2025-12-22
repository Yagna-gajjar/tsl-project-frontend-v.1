import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import type { Account } from "@/types/account";
import AccountTable from "@/components/view/account/account-table";
import AccountFormModal from "@/components/view/account/account-form-modal";
import AccountViewModal from "@/components/view/account/account-view-modal";
import { Button } from "@/components/ui/button";
import AccountExcelUpload from "@/components/view/account/account-excel-upload";

export default function AccountPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editRow, setEditRow] = useState<Account>();
  const [viewId, setViewId] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);

  const [excelOpen, setExcelOpen] = useState(false);
  const bumpRefresh = () => setRefreshKey((s) => s + 1);

  const handleSaved = () => {
    bumpRefresh();
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Account Management</h1>
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
            <Plus className="w-4 h-4 mr-2" /> Add Account
          </Button>
        </div>
      </div>

      <AccountTable
        refreshKey={refreshKey}
        onEdit={(r) => {
          setEditRow(r);
          setFormOpen(true);
        }}
        onView={(r) => {
          setViewId(r.accountId);
          setViewOpen(true);
        }}
      />

      <AccountFormModal
        isOpen={formOpen}
        initialData={editRow}
        onClose={() => {
          setFormOpen(false);
          setEditRow(undefined);
        }}
        onSave={() => setRefreshKey((p) => p + 1)}
      />

      <AccountViewModal
        isOpen={viewOpen}
        accountId={viewId}
        onClose={() => setViewOpen(false)}
      />

      <AccountExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={() => {
          handleSaved();
        }}
      />
    </div>
  );
}
