import { deleteBatch, getBatch } from "@/api/batch.api";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { Batch } from "@/types/batch";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  onView?: (row: Batch) => void;
  onEdit?: (row: Batch) => void;
  refreshKey?: number;
};

export default function BatchTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<
    Record<string, string | number | undefined>
  >({});
  const [sortBy, setSortBy] = useState<string>("batchId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const navigate = useNavigate();

  // Helper: format a time input (Date | "HH:mm" | ISO string | number) into "HH:mm"
  const formatTimeDisplay = (t: unknown): string => {
    if (t === undefined || t === null || t === "") return "-";

    try {
      // if already a string like "HH:mm", return normalized
      if (typeof t === "string") {
        const s = t.trim();
        // quick HH:mm match
        const hhmm = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(s);
        if (hhmm) {
          return `${hhmm[1].padStart(2, "0")}:${hhmm[2]}`;
        }
        // try parse as date string (ISO or other)
        const d = new Date(s);
        if (!Number.isNaN(d.getTime())) {
          return format(d, "HH:mm");
        }
        // fallback to raw string
        return s || "-";
      }

      // if it's a Date
      if (t instanceof Date) {
        if (Number.isNaN(t.getTime())) return "-";
        return format(t, "HH:mm");
      }

      // if it's a number (timestamp)
      if (typeof t === "number") {
        const d = new Date(t);
        if (!Number.isNaN(d.getTime())) return format(d, "HH:mm");
      }

      // unknown/unsupported
      return "-";
    } catch {
      return "-";
    }
  };

  // Optional helper: convert numeric week code (e.g. 12 or "134") to readable days
  const weekCodeToNames = (code: unknown): string => {
    if (code === undefined || code === null || code === "") return "-";
    const map: Record<string, string> = {
      "1": "Mon",
      "2": "Tue",
      "3": "Wed",
      "4": "Thu",
      "5": "Fri",
      "6": "Sat",
      "7": "Sun",
    };
    const s = String(code);
    const names: string[] = [];
    for (const ch of s) {
      if (map[ch]) names.push(map[ch]);
    }
    return names.length > 0 ? names.join(", ") : String(code);
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getBatch({
        page,
        limit,
        sortBy,
        sortOrder: sortOrder,
        search: search || undefined,
        batchName: filters.batchName as string | undefined,
        coachFirstName: filters.coachFirstName as string | undefined,
        facilityName: filters.facilityName as string | undefined,
        courseName: filters.courseName as string | undefined,
      });

      const rowsRaw = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? (res?.data as Batch[])
          : [];
      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r) => ({
        ...r,
        // normalize createdAt/updatedAt as Date objects if present
        createdAt: r.createdAt ? new Date(r.createdAt as any) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt as any) : undefined,
      })) as Batch[];
      setData(rows);
    } catch (err) {
      console.error("Failed to fetch batches", err);
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

  const handleDelete = async (id: number | undefined) => {
    if (id === undefined) return;

    try {
      await deleteBatch(id);
      toast({
        title: "Success",
        description: "Batch deleted successfully",
      });
      setDeleteId(null);
      setDeleteOpen(false);
      await loadData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete batch",
        variant: "destructive",
      });
    }
  };

  const columns: Column<Batch>[] = [
    {
      key: "members",
      header: "Members",
      sortable: false,
      filterType: null,
      render: (r) => (
        <div className="flex flex-col">
          <Button
            variant={"outline"}
            onClick={() => { navigate(`/batch/attendance-sheet/${r?.batchId}`) }}>
            <ExternalLink />
          </Button>
        </div>
      )
    },
    {
      key: "batchName",
      header: "Batch Name",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.batchName}</span>
        </div>
      ),
    },
    {
      key: "courseName",
      header: "Course Name",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.courseName}</span>
        </div>
      ),
    },
    {
      key: "coachFirstName",
      header: "Coach Name",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {r.coachFirstName} {r.coachLastName}{" "}
          </span>
        </div>
      ),
    },
    {
      key: "facilityName",
      header: "Facility Name",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.facilityName}</span>
        </div>
      ),
    },
    {
      key: "areaName",
      header: "Area Name",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.areaName}</span>
        </div>
      ),
    },
    {
      key: "introduceDate",
      header: "Introduce Date",
      sortable: true,
      render: (r) =>
        r.introduceDate
          ? new Date(r.introduceDate as any).toLocaleDateString("en-US")
          : "-",
    },
    {
      key: "suspendedDate",
      header: "Suspended Date",
      sortable: true,
      render: (r) =>
        r.suspendedDate
          ? new Date(r.suspendedDate as any).toLocaleDateString("en-US")
          : "-",
    },
    {
      key: "startTime",
      header: "Start Time",
      sortable: true,
      render: (r) => <>{formatTimeDisplay(r.startTime)}</>,
    },
    {
      key: "endTime",
      header: "End Time",
      sortable: true,
      render: (r) => <>{formatTimeDisplay(r.endTime)}</>,
    },
    {
      key: "weekDays",
      header: "Week Days",
      sortable: true,
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{weekCodeToNames(r.weekDays)}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => (
        <div className="flex flex-col">
          <span
            className={`font-medium ${r.status === "active"
              ? "bg-green-600/30 px-3 w-fit pb-1 rounded-lg text-green-600"
              : "bg-red-600/30 px-2 w-fit pb-1 rounded-lg text-red-600"
              }`}
          >
            {r.status}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div>
      <DataTable<Batch>
        data={data}
        columns={columns}
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
        idKey={"batchId"}
      />
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={() => handleDelete(deleteId ?? undefined)}
        title="Delete Batch?"
        description="Are you sure you want to delete this batch? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
