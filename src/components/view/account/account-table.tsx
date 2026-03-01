import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getAccounts, deleteAccount } from "@/api/account.api";
import type { Account } from "@/types/account";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

type Props = {
  onView?: (row: Account) => void;
  onEdit?: (row: Account) => void;
  refreshKey?: number;
  entityId?: number;
  entityType?: string;
};

export default function AccountTable({ onView, onEdit, refreshKey, entityType, entityId }: Props) {
  const [data, setData] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [hideDeLinked, setHideDeLinked] = useState(false);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("accountId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const res: Response<Account[]> = await getAccounts({
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
        entityType: entityType !== "all" ? entityType : undefined,
        entityId: entityId
      });

      setTotal(res.pagination.total);

      const rows = Array.isArray(res?.data) ? res.data : [];

      setData(
        rows.map((r) => ({
          ...r,
          regDate: new Date(r.regDate),
          suspensionDate: r.suspensionDate
            ? new Date(r.suspensionDate)
            : undefined,
        }))
      );
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch accounts",
        variant: "destructive",
      });
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey, entityId, entityType]);

  const columns: Column<Account>[] = [
    { key: "accountName", header: "Account Name", sortable: true },
    { key: "entityType", header: "Define Type" },
    { key: "entityName", header: "Entity Name" },
    { key: "accountType", header: "Account Type" },
    { key: "contact", header: "Contact" },
    { key: "proffesionalSector", header: "Sector" },
    {
      key: "regDate",
      header: "Registration Date",
      sortable: true,
      render: (r) => r.regDate ? format(r.regDate, "dd-MMM-yyyy") : "-",
    },
    {
      key: "suspensionDate",
      header: "Suspension Date",
      render: (r) => r.suspensionDate ? format(r.suspensionDate, "dd-MMM-yyyy") : "-",
    },
  ];

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleExport = async (): Promise<Account[]> => {
    const res: Response<Account[]> = await getAccounts({
      page: 1,
      limit: total,
      sortBy,
      sortOrder,
      search: search || undefined,
    });

    const rows = Array.isArray(res?.data) ? res.data : [];

    return rows.map((r) => ({
      ...r,
      regDate: new Date(r.regDate),
      suspensionDate: r.suspensionDate ? new Date(r.suspensionDate) : undefined,
    }));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAccount(deleteId);
      toast({ title: "Account deleted", variant: "success" });
      loadData();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Checkbox
          id="hide-delinked"
          checked={hideDeLinked}
          onCheckedChange={(v) => setHideDeLinked(Boolean(v))}
        />
        <Label htmlFor="hide-delinked">Hide De-Linked</Label>
      </div>
      <DataTable<Account>
        data={data}
        columns={columns}
        isLoading={isLoading}
        pagination={{ page, limit, total, onPageChange: setPage }}
        onSearchChange={(q) => {
          setSearch(q);
          setPage(1);
        }}
        onSortChange={(c, d) => {
          setSortBy(c);
          setSortOrder(d);
        }}
        onView={onView}
        onEdit={onEdit}
        onDelete={(id) => {
          setDeleteId(id ?? null);
          setDeleteOpen(true);
        }}
        idKey="accountId"
        exportFileName="Account"
        onExport={handleExport}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Account?"
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
}
