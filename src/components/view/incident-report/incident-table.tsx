import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { format } from "date-fns";

import { getIncidentReports, deleteIncidentReport } from "@/api/incidentReport.api";
import type { IncidentReport } from "@/types/incidentReport";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";

type Props = {
  onView?: (row: IncidentReport) => void;
  onEdit?: (row: IncidentReport) => void;
  refreshKey?: number;
};

export default function IncidentTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<IncidentReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, string | number | undefined>>({});
  const [sortBy, setSortBy] = useState<string>("incidentId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loadingDelete, setLoadingDelete] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: Response<IncidentReport[]> = await getIncidentReports({
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
        incidentType: filters.incidentType as string | undefined,
        status: filters.status as string | undefined,
      });

      if (res.success && Array.isArray(res.data)) {
        const rows: IncidentReport[] = res.data.map((r) => ({
          ...r,
          reportedDate: r.reportedDate ? new Date(r.reportedDate) : undefined,
          resolvedDate: r.resolvedDate ? new Date(r.resolvedDate) : undefined,
          createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
          updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
        }));
        setTotal(res.pagination?.total || 0);
        setData(rows);
      } else {
        setData([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Failed to fetch incident reports", error);
      setData([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const columns = useMemo<Column<IncidentReport>[]>(
    () => [
      {
        key: "incidentId",
        header: "Incident ID",
        sortable: true,
        filterType: "number",
        render: (r) => <span className="font-semibold">#{r.incidentId}</span>,
      },
      {
        key: "incidentType",
        header: "Incident Type",
        sortable: true,
        filterType: "text",
        render: (r) => <span className="font-medium">{r.incidentType}</span>,
      },
      {
        key: "reportedByName",
        header: "Reported By",
        sortable: true,
        filterType: "text",
        render: (r) => {
          if (r.reportedByMemberFirstName || r.reportedByMemberLastName) {
            return `${r.reportedByMemberFirstName ?? ""} ${r.reportedByMemberLastName ?? ""}`.trim();
          }
          return r.incidentReportedByName || "-";
        },
      },
      {
        key: "againstName",
        header: "Accused / Against",
        sortable: true,
        filterType: "text",
        render: (r) => {
          if (r.againstMemberFirstName || r.againstMemberLastName) {
            return `${r.againstMemberFirstName ?? ""} ${r.againstMemberLastName ?? ""}`.trim();
          }
          return r.incidentAgainstName || "-";
        },
      },
      {
        key: "academyName",
        header: "Academy",
        sortable: true,
        filterType: "text",
        render: (r) => r.academyName || "-",
      },
      {
        key: "batchName",
        header: "Batch",
        sortable: true,
        filterType: "text",
        render: (r) => r.batchName || "-",
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        filterType: "text",
        render: (r) => {
          const st = (r.status || "ACTIVE").toUpperCase();
          let colorClass = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
          if (st === "RESOLVED" || st === "CLOSED") {
            colorClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
          } else if (st === "DISMISSED" || st === "REJECTED") {
            colorClass = "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400";
          }
          return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
              {st}
            </span>
          );
        },
      },
      {
        key: "reportedDate",
        header: "Reported Date",
        sortable: true,
        filterType: null,
        render: (r) =>
          r.reportedDate instanceof Date
            ? format(r.reportedDate, "dd MMM yyyy")
            : r.reportedDate
            ? String(r.reportedDate)
            : "-",
      },
      {
        key: "handledByUsername",
        header: "Handled By",
        sortable: true,
        filterType: "text",
        render: (r) => r.handledByUsername || "-",
      },
    ],
    []
  );

  const handleSearchChange = (q: string) => {
    setSearch(q);
    setPage(1);
  };

  const handleFilterChange = (filterKey: string, value: string | number | undefined) => {
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

  const handleExport = async (): Promise<IncidentReport[]> => {
    const res = await getIncidentReports({
      page: 1,
      limit: total || 1000,
      sortBy,
      sortOrder,
      search: search || undefined,
    });

    const rowsRaw = Array.isArray(res?.data) ? res.data : [];
    return rowsRaw.map((r) => ({
      ...r,
      reportedDate: r.reportedDate ? new Date(r.reportedDate) : undefined,
      resolvedDate: r.resolvedDate ? new Date(r.resolvedDate) : undefined,
      createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
      updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
    }));
  };

  const handleDelete = (id: number | undefined) => {
    if (id === undefined || id === null) return;
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    try {
      setLoadingDelete(true);
      const res: Response = await deleteIncidentReport(deleteId);
      const ok =
        typeof res?.success !== "undefined"
          ? res.success === true || String(res.success) === "true"
          : true;

      if (!ok) {
        throw new Error(res?.message || "Failed to delete incident report");
      }
      toast({
        title: "Success",
        description: "Incident report deleted successfully.",
      });
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete incident report";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoadingDelete(false);
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="w-full">
      <DataTable<IncidentReport>
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
        onDelete={(id) => handleDelete(typeof id === "number" ? id : Number(id))}
        idKey="incidentId"
        exportFileName="IncidentReports"
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
        title="Delete Incident Report?"
        description="Are you sure you want to delete this incident report? This action cannot be undone."
        confirmText={loadingDelete ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}