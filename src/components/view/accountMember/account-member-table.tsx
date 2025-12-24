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
import { format } from "date-fns";

type Props = {
  onView?: (row: AccountMember) => void;
  onEdit?: (row: AccountMember) => void;
  accountId?: number | undefined;
};

export default function AccountMemberTable({ onView, accountId }: Props) {
  const [data, setData] = useState<AccountMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAccountMembers({ page, limit: 10, accountId: accountId });
      setData(res?.data ?? []);
      setTotal(res.pagination.total);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, accountId]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<AccountMember>[] = [
    {
      key: "memberFirstName",
      header: "Member",
      sortable: true,
      render: (v) => v.memberFirstName + " " + v.memberLastName,
    },
    { key: "accountName", header: "Account", sortable: true },
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
        r.linkDate ? format(new Date(r.linkDate).toLocaleDateString(), "dd-MMM-yyyy") : "-",
    },
    {
      key: "dlinkDate",
      header: "DeLinked On",
      render: (r) =>
        r.dlinkDate ? format(new Date(r.dlinkDate).toLocaleDateString(), "dd-MMM-yyyy") : <i>Linked</i>,
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
          total: total,
          onPageChange: setPage,
        }}
        onView={onView}
        // onEdit={onEdit}
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
