import { useState } from "react";
import { Plus } from "lucide-react";
import type { Account } from "@/types/account";
import AccountTable from "@/components/view/account/account-table";
import AccountFormModal from "@/components/view/account/account-form-modal";
import AccountViewModal from "@/components/view/account/account-view-modal";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editRow, setEditRow] = useState<Account>();
  const [viewId, setViewId] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Account Management</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Account
        </Button>
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
    </div>
  );
}
