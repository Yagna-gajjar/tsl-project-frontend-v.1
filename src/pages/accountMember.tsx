import { useState } from "react";

import AccountMemberTable from "@/components/view/accountMember/account-member-table";
import AccountMemberFormModal from "@/components/view/accountMember/account-member-form-modal";
import AccountMemberViewModal from "@/components/view/accountMember/account-member-view-modal";

import type { AccountMember } from "@/types/accountMember";
import { Button } from "@/components/ui/button";

export default function AccountMemberPage() {
  const [openForm, setOpenForm] = useState(false);
  const [openView, setOpenView] = useState(false);

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Account Members</h1>
        <Button onClick={handleAdd}>Link Member</Button>
      </div>

      {/* Table */}
      <AccountMemberTable
        key={refreshKey}
        onEdit={handleEdit}
        onView={handleView}
      />

      {/* Form Modal */}
      <AccountMemberFormModal
        isOpen={openForm}
        initialData={selected ?? undefined}
        onClose={() => setOpenForm(false)}
        onSaved={handleSaved}
      />

      {/* View Modal */}
      <AccountMemberViewModal
        isOpen={openView}
        accountMemberId={selected?.accountMemberId}
        onClose={() => setOpenView(false)}
      />
    </div>
  );
}
