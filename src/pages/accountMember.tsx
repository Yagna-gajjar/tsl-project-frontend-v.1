import { useState } from "react";

import AccountMemberTable from "@/components/view/accountMember/account-member-table";
import AccountMemberFormModal from "@/components/view/accountMember/account-member-form-modal";
import AccountMemberViewModal from "@/components/view/accountMember/account-member-view-modal";
import AccountMemberBulkFormModal from "@/components/view/accountMember/account-member-bulk-form-modal";

import type { AccountMember } from "@/types/accountMember";
import { Button } from "@/components/ui/button";

export default function AccountMemberPage() {
  const [openForm, setOpenForm] = useState(false);
  const [openView, setOpenView] = useState(false);

  const [openBulkForm, setOpenBulkForm] = useState(false);

  const [selected, setSelected] = useState<AccountMember | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setSelected(null);
    setOpenForm(true);
  };

  const handleEdit = (row: AccountMember) => {
    setSelected(row);
    setOpenForm(true);
  };

  const handleView = (row: AccountMember) => {
    setSelected(row);
    setOpenView(true);
  };

  const handleSaved = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleBulkAdd = () => {
    setOpenBulkForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Account Members</h1>
        <div className="gap-3 flex">
          <Button onClick={handleBulkAdd}>Bulk Link Member</Button>
          <Button onClick={handleAdd}>Link Member</Button>
        </div>
      </div>

      <AccountMemberTable
        key={refreshKey}
        onEdit={handleEdit}
        onView={handleView}
      />

      <AccountMemberFormModal
        isOpen={openForm}
        initialData={selected ?? undefined}
        onClose={() => setOpenForm(false)}
        onSaved={handleSaved}
      />

      <AccountMemberViewModal
        isOpen={openView}
        accountMemberId={selected?.accountMemberId}
        onClose={() => setOpenView(false)}
      />

      <AccountMemberBulkFormModal
        isOpen={openBulkForm}
        onClose={() => setOpenBulkForm(false)}
      />
    </div>
  );
}