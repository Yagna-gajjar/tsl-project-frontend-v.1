import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getDiscounts, deleteDiscount } from "@/api/discount.api";
import type { Discount } from "@/types/discount";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

type Props = {
  onView?: (row: Discount) => void;
  onEdit?: (row: Discount) => void;
  refreshKey?: number;
};

export default function DiscountTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<
    Record<string, string | number | undefined>
  >({});
  const [sortBy, setSortBy] = useState<string>("discountId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getDiscounts({
        page,
        limit,
        sortBy,
        sortOrder: sortOrder,
        search: search || undefined,
        courseId: filters.courseId as number | undefined,
        status: filters.status as string | undefined,
        courseName: filters.courseName as string | undefined,
      });

      const rowsRaw = Array.isArray(res)
        ? res
        : Array.isArray((res as Record<string, unknown>)?.data)
        ? ((res as Record<string, unknown>).data as Discount[])
        : [];
      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r) => ({
        ...r,
        introduceDate: r.introduceDate ? new Date(r.introduceDate) : undefined,
        suspendDate: r.suspendDate ? new Date(r.suspendDate) : undefined,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      })) as Discount[];

      setData(rows);
    } catch (error) {
      console.error("Failed to fetch discounts", error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

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

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDiscount(deleteId);
      setData((prev) => prev.filter((d) => d.discountId !== deleteId));
      toast({
        title: "Success",
        description: "Discount deleted successfully",
        variant: "default",
      });
      setDeleteOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete discount", error);
      toast({
        title: "Error",
        description: "Failed to delete discount",
        variant: "destructive",
      });
    }
  };

  const columns: Column<Discount>[] = [
    {
      header: "Discount ID",
      key: "discountId",
      render: (row: Discount) => row.discountId || "-",
      sortable: true,
    },
    {
      header: "Course",
      key: "courseName",
      render: (row: Discount) => row.courseName || `Course ${row.courseId}`,
      filterType: "text",
      sortable: true,
    },
    {
      header: "Above Units",
      key: "aboveUnits",
      render: (row: Discount) => row.aboveUnits || "-",
      sortable: true,
    },
    {
      header: "Discount %",
      key: "discountPercentage",
      render: (row: Discount) =>
        `${Number(row.discountPercentage)?.toFixed(2) || "0.00"}%`,
      sortable: true,
      filterType: "number",
    },
    {
      header: "Introduce Date",
      key: "introduceDate",
      render: (row: Discount) =>
        row.introduceDate
          ? new Date(row.introduceDate).toLocaleDateString()
          : "-",
      sortable: true,
    },
    {
      header: "Suspend Date",
      key: "suspendDate",
      render: (row: Discount) =>
        row.suspendDate ? new Date(row.suspendDate).toLocaleDateString() : "-",
    },
    {
      header: "Status",
      key: "status",
      filterType: "select",
      filterOptions: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
      render: (row: Discount) => {
        const status = row.status || "active";
        const statusColor =
          status.toLowerCase() === "active"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800";
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      header: "Created",
      key: "createdAt",
      render: (row: Discount) =>
        row.createdAt ? row.createdAt.toLocaleDateString() : "-",
      sortable: true,
    },
  ];

  return (
    <div>
      <DataTable<Discount>
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
        onDelete={(discountId: number | undefined) => {
          setDeleteId(discountId ?? null);
          setDeleteOpen(true);
        }}
        idKey={"discountId"}
      />
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Discount?"
        description="Are you sure you want to delete this discount? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
