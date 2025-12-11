import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import type { Appointment } from "@/types/appointment";
import { getAppointments, deleteAppointment } from "@/api/appointment.api";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

type Props = {
  onView?: (row: Appointment) => void;
  onEdit?: (row: Appointment) => void;
  refreshKey?: number;
};

export default function AppointmentTable({
  onView,
  onEdit,
  refreshKey,
}: Props) {
  const [data, setData] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(10);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<
    Record<string, string | number | undefined>
  >({});
  const [sortBy, setSortBy] = useState<string>("appointmentId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getAppointments({
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
        enrollmentId: filters.enrollmentId as number | undefined,
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
      })) as Appointment[];
      setTotal(res.pagination.total);
      setData(rows);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
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
      await deleteAppointment(id);
      toast({
        title: "Success",
        description: "Appointment deleted successfully",
      });
      setDeleteOpen(false);
      setDeleteId(null);
      await loadData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete appointment",
        variant: "destructive",
      });
    }
  };

  const columns: Column<Appointment>[] = [
    {
      key: "appointmentId",
      header: "ID",
      sortable: true,
      filterType: null,
      render: (r) => <span>{r.appointmentId}</span>,
    },
    {
      key: "enrollmentName",
      header: "Enrollment",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <span className="font-medium">
          {r.enrollmentName ?? r.enrollmentId ?? "N/A"}
        </span>
      ),
    },
    {
      key: "noOfPerson",
      header: "No. of Persons",
      sortable: true,
      filterType: null,
      render: (r) => <span>{r.noOfPerson ?? 1}</span>,
    },
    {
      key: "batchName",
      header: "Batch",
      sortable: true,
      filterType: "text",
      render: (r) => <span>{r.batchName ?? r.batchId ?? "-"}</span>,
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
      <DataTable<Appointment>
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
        idKey={"appointmentId"}
      />
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={() => handleDelete(deleteId ?? undefined)}
        title="Delete Appointment?"
        description="Are you sure you want to delete this appointment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
