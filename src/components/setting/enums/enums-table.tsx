import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getAllEnums, deleteEnum } from "@/api/enums.api";
import type { Enums } from "@/types/enums";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";

type Props = {
  onView?: (row: Enums) => void;
  onEdit?: (row: Enums) => void;
  refreshKey?: number;
};

export default function EnumsTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<Enums[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, string | number | Date | Object>>({});
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(
    async (opts?: { page?: number; limit?: number }) => {
      try {
        setIsLoading(true);

        const currentPage = opts?.page ?? page;
        const currentLimit = opts?.limit ?? limit;

        const res: Response<Enums[]> | any = await getAllEnums({
          page: currentPage,
          limit: currentLimit,
          search,
          filters,
          sortBy,
          sortOrder
        });

        const rowsRaw = Array.isArray(res?.data) ? res.data : [];

        setData(rowsRaw);
        setTotal(res?.pagination?.total || 0);
      } catch (err) {
        console.error("Failed to fetch enums", err);
        setData([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    },
    [search, filters, sortBy, sortOrder, page, limit]
  );


  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const columns: Column<Enums>[] = [
    {
      key: "category",
      header: "Category",
      sortable: true,
      filterType: "text",
      render: (r) => r.category ?? "-",
    },
    {
      key: "value",
      header: "Value",
      sortable: true,
      filterType: null,
      render: (r) => r.value ?? "-",
    },
  ];

  const handleSearchChange = (q: string) => {
    setPage(1);
    setSearch(q);
  };

  const handleFilterChange = (key: string, value: any) => {
    setPage(1);
    setFilters((prev) => {
      const next = { ...prev };
      if (value === "" || value === null || value === undefined)
        delete next[key];
      else next[key] = value;
      return next;
    });
  };

  const handleSortChange = (key: string, direction: "ASC" | "DESC") => {
    setSortBy(key || "id");
    setSortOrder(direction || "ASC");
    setPage(1);
  };

  // when page/limit changes, reload
  useEffect(() => {
    loadData();
  }, [page, limit, loadData]);

  const handlePageChange = (p: number) => setPage(p);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleDelete = (id?: number) => {
    if (id === undefined || id === null) return;
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    try {
      setLoadingDelete(true);
      const res = await deleteEnum(deleteId);

      if (!res?.success) {
        throw new Error(res?.message || "Failed to delete");
      }

      toast({
        title: "Deleted",
        description: "Enum deleted successfully.",
        variant: "success",
      });

      // reload current page (if deletion reduces pages, adjust page)
      const newTotal = Math.max(0, total - 1);
      const maxPage = Math.max(1, Math.ceil(newTotal / limit));
      if (page > maxPage) setPage(maxPage);
      await loadData();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete enum.",
        variant: "destructive",
      });
    } finally {
      setLoadingDelete(false);
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div>
      <DataTable<Enums>
        data={data}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          limit,
          total,
          onPageChange: handlePageChange,
        }}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onView={(row) => onView?.(row)}
        onEdit={(row) => onEdit?.(row)}
        onDelete={(id: number | undefined) => handleDelete(id)}
        idKey={"id"}
      />
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          if (!loadingDelete) {
            setDeleteOpen(false);
            setDeleteId(null);
          }
        }}
        onConfirm={handleDeleteConfirmed}
        title="Delete Enum?"
        description="Are you sure you want to delete this enum? This action cannot be undone."
        confirmText={loadingDelete ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
