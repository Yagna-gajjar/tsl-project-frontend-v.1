import { getBatch, reassignRequiredBatch } from "@/api/batch.api";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { Batch } from "@/types/batch";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  onView?: (row: Batch) => void;
  onEdit?: (row: Batch) => void;
  refreshKey?: number;
};

const WEEK_CODE_MAP: Record<string, string> = {
  "1": "Mon", "2": "Tue", "3": "Wed", "4": "Thu", "5": "Fri", "6": "Sat", "7": "Sun",
};

const formatTimeDisplay = (t: string | null | undefined): string => {
  if (!t) return "-";
  return t.substring(0, 5);
};

const weekCodeToNames = (code: string | null | undefined): string => {
  if (!code) return "-";
  const names: string[] = [];
  for (const ch of String(code)) {
    if (WEEK_CODE_MAP[ch]) names.push(WEEK_CODE_MAP[ch]);
  }
  return names.length > 0 ? names.join(", ") : String(code);
};

export default function BatchTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<Batch[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setIsLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, string | number | undefined>>({});
  const [sortBy, setSortBy] = useState<string>("batchId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const navigate = useNavigate();

  const handlePageChange = (p: number) => setPage(p);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getBatch({
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
        batchName: filters.batchName as string,
        status: filters.status as string,
        courseName: filters.courseName as string,
        activityName: filters.activityName as string,
        entityName: filters.entityName as string,
        batchType: filters.batchType as string,
        admissionCriteria: filters.admissionCriteria as string,
      });

      const rowsRaw = res?.data || [];
      const rows = rowsRaw.map((r: any) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      })) as Batch[];

      setData(rows);
      setTotal(res?.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch batches", err);
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
    setSearch(q);
    setPage(1);
  };

  const handleFilterChange = (key: string, value: string | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const handleSortChange = (column: string, direction: "ASC" | "DESC") => {
    setSortBy(column);
    setSortOrder(direction);
    setPage(1);
  };

  const handleExport = async (): Promise<Batch[]> => {
    const res = await getBatch({
      page: 1,
      limit: 1000, // Export all
      search: search || undefined,
      ...filters
    });
    return res?.data || [];
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleDelete = async (id: number | null) => {
    if (id === null) return;
    try {
      const res = await reassignRequiredBatch(id);
      if (res.data?.required) {
        navigate("/batches/batch-change-bulk", {
          state: {
            batch_id: id,
            reassignment_batchMember: res.data.batchMembers
          }
        })
      }

      toast({ title: "Success", description: "Batch deleted successfully" });
      setDeleteOpen(false);
      loadData();
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const columns = useMemo<Column<Batch>[]>(() => [
    {
      key: "members",
      header: "Action",
      sortable: false,
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/batch/attendance-sheet/${r.batchId}`)}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      ),
    },
    {
      key: "batchName",
      header: "Batch Name",
      sortable: true,
      filterType: "text",
      render: (r) => <span className="font-medium">{r.batchName}</span>,
    },
    {
      key: "courseName",
      header: "Course",
      sortable: true,
      filterType: "text",
    },
    {
      key: "entityName",
      header: "Entity",
      sortable: true,
      filterType: "text",
    },
    {
      key: "batchType",
      header: "Type",
      sortable: true,
      filterType: "text",
    },
    {
      key: "introduceDate",
      header: "Start Date",
      sortable: true,
      render: (r) => r.introduceDate ? format(new Date(r.introduceDate), "dd MMM yyyy") : "-",
    },
    {
      key: "startTime",
      header: "Time Slot",
      sortable: true,
      render: (r) => (
        <span className="text-xs font-mono">
          {formatTimeDisplay(r.startTime)} - {formatTimeDisplay(r.endTime)}
        </span>
      ),
    },
    {
      key: "daysPattern",
      header: "Days",
      sortable: true,
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {weekCodeToNames(r.daysPattern as string)}
        </span>
      ),
    },
    {
      key: "activeMemberCount",
      header: "Capacity",
      sortable: true,
      render: (r) => {
        const count = r.activeMemberCount || 0;
        const max = r.maxCapacity || 1;
        const percentage = (count / max) * 100;
        let color = "text-green-600";
        if (percentage >= 100) color = "text-red-600 font-bold";
        else if (percentage >= 80) color = "text-yellow-600";

        return (
          <span className={`font-medium ${color}`}>
            {count} / {max}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${r.status === "active"
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
            }`}
        >
          {r.status}
        </span>
      ),
    },
  ], [navigate]);

  return (
    <div className="space-y-4">
      <DataTable<Batch>
        data={data}
        isLoading={loading}
        columns={columns}
        pagination={{
          page,
          limit,
          total,
          onPageChange: handlePageChange,
        }}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onView={onView}
        onEdit={onEdit}
        onDelete={(id) => {
          setDeleteId(Number(id));
          setDeleteOpen(true);
        }}
        idKey="batchId"
        exportFileName="Batches_List"
        onExport={handleExport}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => handleDelete(deleteId)}
        title="Delete Batch?"
        description="This action cannot be undone. This will permanently delete the batch and remove its associations."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}