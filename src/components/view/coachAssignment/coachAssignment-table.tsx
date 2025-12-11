// src/components/coach-assignment/CoachAssignmentTable.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import type { CoachAssignment } from "@/types/coachAssignment";
import {
  getCoachAssignments,
  deleteCoachAssignment,
} from "@/api/coachAssignment.api";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

type Props = {
  onView?: (row: CoachAssignment) => void;
  onEdit?: (row: CoachAssignment) => void;
  refreshKey?: number;
};

export default function CoachAssignmentTable({
  onView,
  onEdit,
  refreshKey,
}: Props) {
  const [data, setData] = useState<CoachAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<
    Record<string, string | number | undefined>
  >({});
  const [sortBy, setSortBy] = useState<string>("coachAssignmentId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getCoachAssignments({
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
        coachId: filters.coachId as number | undefined,
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
      })) as CoachAssignment[];

      setData(rows);
    } catch (err) {
      console.error("Failed to fetch coach assignments", err);
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
      await deleteCoachAssignment(id);
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

  const columns: Column<CoachAssignment>[] = [
    {
      key: "coachAssignmentId",
      header: "ID",
      sortable: true,
      filterType: null,
      render: (r) => <span>{r.coachAssignmentId}</span>,
    },
    {
      key: "coachName",
      header: "Coach",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <span className="font-medium">{r.coachName ?? r.coachId ?? "N/A"}</span>
      ),
    },
    {
      key: "batchName",
      header: "Batch",
      sortable: true,
      filterType: "text",
      render: (r) => <span>{r.batchName ?? r.batchId ?? "-"}</span>,
    },
    {
      key: "designation",
      header: "Designation",
      sortable: false,
      filterType: "text",
      render: (r) => <span>{r.designation ?? "-"}</span>,
    },
    {
      key: "cost",
      header: "Cost",
      sortable: true,
      filterType: null,
      render: (r) => <span>{r.cost ?? "-"}</span>,
    },
    {
      key: "startDate",
      header: "Start",
      sortable: true,
      filterType: null,
      render: (r) =>
        r.startDate ? new Date(r.startDate).toLocaleDateString() : "-",
    },
    {
      key: "endDate",
      header: "End",
      sortable: true,
      filterType: null,
      render: (r) =>
        r.endDate ? new Date(r.endDate).toLocaleDateString() : "-",
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      filterType: null,
      render: (r) =>
        r.createdAt ? new Date(r.createdAt).toLocaleString() : "-",
    },
  ];

  return (
    <div>
      <DataTable<CoachAssignment>
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
        onDelete={(id) => {
          setDeleteId(id ?? null);
          setDeleteOpen(true);
        }}
        idKey={"coachAssignmentId"}
      />
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={() => handleDelete(deleteId ?? undefined)}
        title="Delete Coach Assignment?"
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
