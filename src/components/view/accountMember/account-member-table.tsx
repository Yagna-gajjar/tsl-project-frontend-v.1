import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import {
  getAccountMembers,
  deleteAccountMember,
} from "@/api/accountMember.api";
import type { AccountMember } from "@/types/accountMember";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

type Props = {
  onView?: (row: AccountMember) => void;
  onEdit?: (row: AccountMember) => void;
};

export default function AccountMemberTable({ onView, onEdit }: Props) {
  const [data, setData] = useState<AccountMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAccountMembers({ page, limit: 10 });
      setData(res?.data ?? []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<AccountMember>[] = [
    { key: "accountMemberId", header: "ID", sortable: true },
    { key: "memberId", header: "Member", sortable: true },
    { key: "accountId", header: "Account", sortable: true },
    {
      key: "relationship",
      header: "Relationship",
    },
    {
      key: "linkBilling",
      header: "Billing Link",
      render: (r) => (r.linkBilling ? "Yes" : "No"),
    },
    {
      key: "linkDate",
      header: "Linked On",
      render: (r) =>
        r.linkDate ? new Date(r.linkDate).toLocaleDateString() : "-",
    },
  ];

  const [delId, setDelId] = useState<number | null>(null);

  const handleExport = async (): Promise<AccountMember[]> => {
    const res = await getAccountMembers({ page: 1, limit: data.length });
    return Array.isArray(res?.data) ? res.data : [];
  };

  return (
    <>
      <DataTable<AccountMember>
        data={data}
        columns={columns}
        isLoading={loading}
        pagination={{
          page,
          limit: 10,
          total: data.length,
          onPageChange: setPage,
        }}
        onView={onView}
        onEdit={onEdit}
        onDelete={(id) => setDelId(id ?? null)}
        idKey="accountMemberId"
        exportFileName="AccountMember"
        onExport={handleExport}
      />

      <ConfirmDialog
        isOpen={!!delId}
        onClose={() => setDelId(null)}
        onConfirm={async () => {
          if (!delId) return;
          await deleteAccountMember(delId);
          toast({ title: "Deleted" });
          setDelId(null);
          load();
        }}
        title="Delete link?"
        description="This will unlink member from account."
        confirmText="Delete"
      />
    </>
  );
}
