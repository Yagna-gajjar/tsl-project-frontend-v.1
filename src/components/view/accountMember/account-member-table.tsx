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

  // 1. Add Filter State
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string>("accountMemberId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // 2. Pass filters and sorting to the API
      const res = await getAccountMembers({
        page,
        limit: 10,
        accountId: accountId,
        sortBy,
        sortOrder,
        ...filters,
      });
      setData(res?.data ?? []);
      setTotal(res.pagination.total);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, accountId, filters, sortBy, sortOrder]);

  useEffect(() => {
    load();
  }, [load]);

  // 3. Handle Filter Changes
  const handleFilterChange = (key: string, value: any) => {
    setPage(1); // Always reset to page 1 when filtering
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (key: string, direction: "ASC" | "DESC") => {
    setSortBy(key);
    setSortOrder(direction);
    setPage(1);
  };

  const columns: Column<AccountMember>[] = [
    {
      key: "memberFirstName",
      header: "Member",
      sortable: true,
      filterType: "text", // Added Filter
      render: (v) => v.memberFirstName + " " + v.memberLastName,
    },
    {
      key: "accountName",
      header: "Account",
      sortable: true,
      filterType: "text", // Added Filter
    },
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
        r.linkDate ? format(new Date(r.linkDate), "dd-MMM-yyyy") : "-",
    },
    {
      key: "dlinkDate",
      header: "DeLinked On",
      render: (r) =>
        r.dlinkDate ? (
          format(new Date(r.dlinkDate), "dd-MMM-yyyy")
        ) : (
          <i>Linked</i>
        ),
    },
  ];

  const [delId, setDelId] = useState<number | null>(null);

  const handleExport = async (): Promise<AccountMember[]> => {
    // Ensure export respects current filters
    const res = await getAccountMembers({
      page: 1,
      limit: total,
      accountId,
      ...filters
    });
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
        onFilterChange={handleFilterChange} // Added Handler
        onSortChange={handleSortChange}     // Added Handler
        onView={onView}
        onDelete={(id) => setDelId(id ? Number(id) : null)}
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