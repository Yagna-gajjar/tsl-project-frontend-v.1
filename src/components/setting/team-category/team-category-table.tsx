import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { format } from "date-fns";

import {
  getTeamCategories,
  deleteTeamCategories,
} from "@/api/team-category.api";
import type { TeamCategory } from "@/types/teamCategory";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";

type Props = {
  onView?: (row: TeamCategory) => void;
  onEdit?: (row: TeamCategory) => void;
  refreshKey?: number;
};

export default function TeamCategoryTable({
  onView,
  onEdit,
  refreshKey,
}: Props) {
  const [data, setData] = useState<TeamCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string>("teamCategoryId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: any = await getTeamCategories({
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
        categoryName: filters.categoryName ?? undefined,
        shortName: filters.shortName ?? undefined,
        access: filters.access ?? undefined,
      } as any);

      const rowsRaw = res?.data ?? res ?? [];
      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r: any) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      })) as TeamCategory[];

      setData(rows);
      setTotal(Number(res?.pagination?.total ?? rows.length ?? 0));
    } catch (err) {
      console.error("Failed to fetch team categories", err);
      setData([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

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
    setSortBy(key || "teamCategoryId");
    setSortOrder(direction || "ASC");
    setPage(1);
  };

  const handlePageChange = (p: number) => setPage(p);
  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // When user clicks "Delete" in the table
  const handleDelete = (id?: number) => {
    if (id === undefined || id === null) return;
    setDeleteId(id);
    setDeleteOpen(true); // open your AlertDialog
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    try {
      setLoadingDelete(true);
      await deleteTeamCategories(deleteId);
      await loadData();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setLoadingDelete(false);
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const columns: Column<TeamCategory>[] = [
    {
      key: "categoryName",
      header: "Category",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.categoryName}</span>
          <span className="text-xs text-muted-foreground">
            {r.shortName ?? "-"}
          </span>
        </div>
      ),
    },
    {
      key: "shortName",
      header: "Short Name",
      sortable: true,
      filterType: "text",
      render: (r) => r.shortName ?? "-",
    },
    {
      key: "access",
      header: "Access",
      sortable: true,
      filterType: "select",
      filterOptions: [
        { label: "Full", value: "full" },
        { label: "Ground", value: "ground" },
        { label: "Area", value: "area" },
        { label: "Office", value: "office" },
      ],
      render: (r) => r.access ?? "-",
    },
    {
      key: "details",
      header: "Details",
      sortable: false,
      filterType: null,
      render: (r) => (r.details ? String(r.details).slice(0, 80) : "-"),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      filterType: null,
      render: (r) => (r.createdAt ? format(r.createdAt, "dd MMM yyyy") : "-"),
    },
  ];

  return (
    <div>
      <DataTable<TeamCategory>
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
        onDelete={(id) => handleDelete(id)}
        idKey={"teamCategoryId"}
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
        title="Delete Team Category?"
        description="Are you sure you want to delete this Team Category? This action cannot be undone."
        confirmText={loadingDelete ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
