"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { format } from "date-fns";
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

function compareValues(a: any, b: any, direction: "ASC" | "DESC") {
  if (a === b) return 0;
  // handle undefined/null
  if (a == null) return direction === "ASC" ? 1 : -1;
  if (b == null) return direction === "ASC" ? -1 : 1;

  // Dates
  if (
    a instanceof Date ||
    b instanceof Date ||
    (typeof a === "string" && !isNaN(Date.parse(a)))
  ) {
    const da = new Date(a).getTime();
    const db = new Date(b).getTime();
    return direction === "ASC" ? da - db : db - da;
  }

  // Numbers
  if (typeof a === "number" || typeof b === "number") {
    const na = Number(a);
    const nb = Number(b);
    return direction === "ASC" ? na - nb : nb - na;
  }

  // Fallback string compare
  const sa = String(a).toLowerCase();
  const sb = String(b).toLowerCase();
  if (sa < sb) return direction === "ASC" ? -1 : 1;
  if (sa > sb) return direction === "ASC" ? 1 : -1;
  return 0;
}

export default function EnumsTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<Enums[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(
    async (opts?: { page?: number; limit?: number }) => {
      try {
        setIsLoading(true);
        const res: Response = await getAllEnums();

        const rowsRaw = Array.isArray(res?.data) ? res.data : [];

        // Apply search + filters
        const filtered = rowsRaw.filter((r: any) => {
          // search applied against 'value' (existing behavior)
          if (search) {
            const val = String(r.value ?? "").toLowerCase();
            if (!val.includes(search.toLowerCase())) return false;
          }

          // apply each filter (if present)
          for (const key of Object.keys(filters)) {
            const filterVal = filters[key];
            if (
              filterVal === null ||
              filterVal === undefined ||
              filterVal === ""
            )
              continue;

            const rowVal = r[key];
            // for string filters do substring match; otherwise strict equality
            if (typeof filterVal === "string") {
              if (
                !String(rowVal ?? "")
                  .toLowerCase()
                  .includes(String(filterVal).toLowerCase())
              ) {
                return false;
              }
            } else {
              if (String(rowVal) !== String(filterVal)) return false;
            }
          }

          return true;
        }) as Enums[];

        // Sorting
        const sorted = [...filtered];
        if (sortBy) {
          sorted.sort((a: any, b: any) =>
            compareValues(a[sortBy], b[sortBy], sortOrder)
          );
        }

        // Pagination (client-side)
        const p = opts?.page ?? page;
        const l = opts?.limit ?? limit;
        const start = (p - 1) * l;
        const paged = sorted.slice(start, start + l);

        setData(paged);
        setTotal(sorted.length);
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

  // initial & dependency-driven load
  useEffect(() => {
    loadData();
    // refreshKey allows parent to force reload
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
