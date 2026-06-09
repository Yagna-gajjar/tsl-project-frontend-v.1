import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import type { FacilityAllotment } from "@/types/facilityAllotment";
import {
  getFacilityAllotments,
  deleteFacilityAllotment,
} from "@/api/facilityAllotment.api";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

type Props = {
  onView?: (row: FacilityAllotment) => void;
  onEdit?: (row: FacilityAllotment) => void;
  refreshKey?: number;
};

export default function FacilityAllotmentTable({
  onView,
  onEdit,
  refreshKey,
}: Props) {
  const [data, setData] = useState<FacilityAllotment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<
    Record<string, string | number | undefined>
  >({});
  const [sortBy, setSortBy] = useState<string>("facilityAllotmentId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getFacilityAllotments({
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
        facilityId: filters.facilityId as number | undefined,
        areaId: filters.areaId as number | undefined,
        batchId: filters.batchId as number | undefined,
      });

      const rowsRaw = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r) => ({
        ...r,
        createdAt: (r as any).createdAt
          ? new Date((r as any).createdAt)
          : undefined,
        updatedAt: (r as any).updatedAt
          ? new Date((r as any).updatedAt)
          : undefined,
      })) as FacilityAllotment[];
      setTotal(res.pagination.total);
      setData(rows);
    } catch (err) {
      console.error("Failed to fetch facility allotments", err);
      setTotal(0);
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
    setFilters((prev) => ({ ...prev, [filterKey]: value || undefined }));
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

  const handleDelete = async (id: number | undefined) => {
    if (id === undefined) return;
    try {
      await deleteFacilityAllotment(id);
      toast({ title: "Success", description: "Deleted successfully" });
      setDeleteOpen(false);
      setDeleteId(null);
      await loadData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const columns = useMemo<Column<FacilityAllotment>[]>(() => [
    {
      key: "facilityAllotmentId",
      header: "ID",
      sortable: true,
      filterType: null,
      render: (r) => <span>{r.facilityAllotmentId}</span>,
    },
    {
      key: "facilityName",
      header: "Facility",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <span className="font-medium">
          {r.facilityName ?? r.facilityId ?? "N/A"}
        </span>
      ),
    },
    {
      key: "areaName",
      header: "Area",
      sortable: true,
      filterType: "text",
      render: (r) => <span>{r.areaName ?? r.areaId ?? "-"}</span>,
    },
    {
      key: "batchName",
      header: "Batch",
      sortable: true,
      filterType: "text",
      render: (r) => <span>{r.batchName ?? r.batchId ?? "-"}</span>,
    },
    {
      key: "level",
      header: "Level",
      sortable: true,
      render: (r) => <span>{r.level ?? 1}</span>,
    },
    {
      key: "assignmentDate",
      header: "Assigned On",
      sortable: true,
      filterType: null,
      render: (r) =>
        r.assignmentDate
          ? new Date(r.assignmentDate).toLocaleDateString()
          : "-",
    },
    {
      key: "unAssignmentDate",
      header: "Unassigned On",
      sortable: true,
      filterType: null,
      render: (r) =>
        r.unAssignmentDate
          ? new Date(r.unAssignmentDate).toLocaleDateString()
          : "-",
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      filterType: null,
      render: (r) =>
        r.createdAt ? new Date(r.createdAt).toLocaleString() : "-",
    },
  ], []);

  return (
    <div>
      <DataTable<FacilityAllotment>
        data={data}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          limit,
          total: total,
          onPageChange: handlePageChange,
        }}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onView={(row) => onView?.(row)}
        onEdit={(row) => onEdit?.(row)}
        onDelete={(id) => {
          setDeleteId(id ?? null);
          setDeleteOpen(true);
        }}
        idKey={"facilityAllotmentId"}
      />
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={() => handleDelete(deleteId ?? undefined)}
        title="Delete Facility Allotment?"
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
