import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { format } from "date-fns";

import { getActivities, deleteActivity } from "@/api/activity.api";
import type { Activity } from "@/types/activity";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";

type Props = {
  onView?: (row: Activity) => void;
  onEdit?: (row: Activity) => void;
  refreshKey?: number;
};

export default function ActivityTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<
    Record<string, string | number | undefined>
  >({});
  const [sortBy, setSortBy] = useState<string>("activityId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: Response<Activity[]> = await getActivities({
        page,
        limit,
        sortBy,
        sorting: sortOrder,
        search: search || undefined,
        activityName: filters.activityName as string | undefined,
        activityType: filters.activityType as string | undefined,
      });

      const rowsRaw = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      })) as Activity[];

      setData(rows);
      const totalCount = rows.length ?? 0;
      setTotal(totalCount);
    } catch (err) {
      console.error("Failed to fetch activities", err);
      setData([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const columns: Column<Activity>[] = [
    {
      key: "activityName",
      header: "Activity Name",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.activityName}</span>
        </div>
      ),
    },
    {
      key: "activityType",
      header: "Activity Type",
      sortable: true,
      filterType: "text",
      render: (r) => r.activityType ?? "-",
    },
    {
      key: "description",
      header: "Description",
      sortable: false,
      filterType: null,
      render: (r) => r.description ?? "-",
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      filterType: null,
      render: (r) => (r.createdAt ? format(r.createdAt, "dd MMM yyyy") : "-"),
    },
  ];

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
    if (column === "") {
      setSortBy("activityId");
      setSortOrder("ASC");
      return;
    }
    setSortBy(column);
    setSortOrder(direction);
    setPage(1);
  };

  const handlePageChange = (p: number) => setPage(p);

  const handleExport = async (): Promise<Activity[]> => {
    const res: Response<Activity[]> = await getActivities({
      page: 1,
      limit: total,
      sortBy,
      sorting: sortOrder,
      search: search || undefined,
      activityName: filters.activityName as string | undefined,
      activityType: filters.activityType as string | undefined,
    });

    return Array.isArray(res?.data) ? res.data : [];
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleDelete = (id: number | undefined) => {
    if (id === undefined || id === null) return;
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    try {
      setLoadingDelete(true);
      const res: Response = await deleteActivity(deleteId);
      const ok =
        typeof res?.success !== "undefined"
          ? res.success === true || String(res.success) === "true"
          : true;

      if (!ok) {
        throw new Error(res?.message || "Failed to delete activity");
      }
      await loadData();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete activity.",
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
      <DataTable<Activity>
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
        idKey={"activityId"}
        exportFileName="Activities"
        onExport={handleExport}
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
        title="Delete Activity?"
        description="Are you sure you want to delete this activity? This action cannot be undone."
        confirmText={loadingDelete ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
