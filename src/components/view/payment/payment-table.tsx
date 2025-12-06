import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";

import { getPayments, deletePayment } from "@/api/payment.api";
import type { Payment } from "@/types/payment";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

type Props = {
  onView?: (row: Payment) => void;
  onEdit?: (row: Payment) => void; // kept for parity, though form is removed upstream
  refreshKey?: number;
};

export default function PaymentTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<
    Record<string, string | number | undefined>
  >({});
  const [sortBy, setSortBy] = useState<string>("paymentId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getPayments({
        page,
        limit,
        sortBy,
        sorting: sortOrder,
        search: search || undefined,
        paymentType: filters.paymentType as string | undefined,
        paymentMode: filters.paymentMode as string | undefined,
      });

      const rowsRaw = Array.isArray(res)
        ? res
        : Array.isArray((res as Record<string, unknown>)?.data)
        ? ((res as Record<string, unknown>).data as Payment[])
        : [];
      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
      })) as Payment[];

      setData(rows);
    } catch (err) {
      console.error("Failed to fetch payments", err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handleSearchChange = (q: string) => {
    setSearch(q);
    setPage(1);
  };

  const handleFilterChange = (
    filterKey: string,
    value: string | number | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value || undefined,
    }));
    setPage(1);
  };

  const handleSortChange = (column: string, direction: "ASC" | "DESC") => {
    setSortBy(column);
    setSortOrder(direction);
    setPage(1);
  };

  const handlePageChange = (p: number) => setPage(p);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const columns: Column<Payment>[] = [
    {
      key: "paymentId",
      header: "ID",
      sortable: true,
      filterType: null,
      render: (r) => <span className="font-medium">{r.paymentId}</span>,
    },
    {
      key: "memberName",
      header: "Member",
      sortable: true,
      filterType: "text",
      render: (r) => <span className="text-sm">{r.memberName ?? "-"}</span>,
    },
    {
      key: "academyName",
      header: "Academy",
      sortable: true,
      filterType: "text",
      render: (r) => <span className="text-sm">{r.academyName ?? "-"}</span>,
    },
    {
      key: "paymentType",
      header: "Type",
      sortable: true,
      filterType: null,
      render: (r) => <span className="text-sm">{r.paymentType ?? "-"}</span>,
    },
    {
      key: "paymentMode",
      header: "Mode",
      sortable: true,
      filterType: null,
      render: (r) => <span className="text-sm">{r.paymentMode ?? "-"}</span>,
    },
    {
      key: "totalAmount",
      header: "Total",
      sortable: true,
      filterType: null,
      render: (r) => (
        <span className="text-sm">{Number(r.totalAmount)?.toFixed(2) ?? "-"}</span>
      ),
    },
    {
      key: "paid",
      header: "Paid",
      sortable: true,
      filterType: null,
      render: (r) => (
        <span className="text-sm">{Number(r.paid)?.toFixed(2) ?? "-"}</span>
      ),
    },
    {
      key: "remaining",
      header: "Remaining",
      sortable: true,
      filterType: null,
      render: (r) => (
        <span className="text-sm">{Number(r.remaining)?.toFixed(2) ?? "-"}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      filterType: null,
      render: (r) =>
        r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US") : "-",
    },
  ];

  const handleDelete = async (id: number | undefined) => {
    if (id === undefined) return;

    try {
      await deletePayment(id);
      toast({
        title: "Success",
        description: "Payment deleted successfully",
      });
      setDeleteId(null);
      setDeleteOpen(false);
      await loadData();
    } catch (err) {
      console.error("delete payment failed", err);
      toast({
        title: "Error",
        description: "Failed to delete payment",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <DataTable<Payment>
        data={data}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          limit,
          total: data.length,
          onPageChange: handlePageChange,
        }}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onView={(row) => onView?.(row)}
        onEdit={(row) => onEdit?.(row)}
        onDelete={(id: number | undefined) => {
          setDeleteId(id ?? null);
          setDeleteOpen(true);
        }}
        idKey={"paymentId"}
      />
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={() => handleDelete(deleteId ?? undefined)}
        title="Delete Payment?"
        description="Are you sure you want to delete this payment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
