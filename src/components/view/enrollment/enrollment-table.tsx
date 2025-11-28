import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getEnrollments, deleteEnrollment } from "@/api/enrollment.api";
import type { Enrollment } from "@/types/enrollment";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

type Props = {
  onView?: (row: Enrollment) => void;
  onEdit?: (row: Enrollment) => void;
  refreshKey?: number;
};

export default function EnrollmentTable({
  onView,
  onEdit,
  refreshKey,
}: Props) {
  const [data, setData] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<
    Record<string, string | number | undefined>
  >({});
  const [sortBy, setSortBy] = useState<string>("enrollmentId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getEnrollments({
        page,
        limit,
        sortBy,
        sortOrder: sortOrder,
        search: search || undefined,
        academyId: filters.academyId as number | undefined,
        courseId: filters.courseId as number | undefined,
        memberId: filters.memberId as number | undefined,
          status: filters.status as string | undefined,
          memberFirstName: filters.memberFirstName as string | undefined,
          academyName: filters.academyName as string | undefined,
            courseName: filters.courseName as string | undefined,
      });

      const rowsRaw = Array.isArray(res)
        ? res
        : Array.isArray((res as Record<string, unknown>)?.data)
          ? ((res as Record<string, unknown>).data as Enrollment[])
          : [];
      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r) => ({
        ...r,
        enrollmentDate: r.enrollmentDate
          ? new Date(r.enrollmentDate)
          : undefined,
        startDate: r.startDate ? new Date(r.startDate) : undefined,
        endDate: r.endDate ? new Date(r.endDate) : undefined,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      })) as Enrollment[];

      setData(rows);
    } catch {
      console.error("Failed to fetch enrollments");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

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

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEnrollment(deleteId);
      setData((prev) => prev.filter((e) => e.enrollmentId !== deleteId));
      toast({
        title: "Success",
        description: "Enrollment deleted successfully",
      });
      setDeleteOpen(false);
      setDeleteId(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete enrollment",
        variant: "destructive",
      });
    }
  };

  const columns: Column<Enrollment>[] = [
    {
      header: "Enrollment ID",
      key: "enrollmentId",
      render: (row: Enrollment) => row.enrollmentId || "-",
      sortable: true,
    },
    {
      header: "Academy Name",
      key: "academyName",
      sortable: true,
      render: (row: Enrollment) => row.academyName || "-",
      filterType: "text",
    },
    {
      header: "Member Name",
      key: "memberFirstName",
      sortable: true,
      render: (row: Enrollment) =>
        row.memberFirstName + " " + row.memberLastName || "-",
      filterType: "text",
    },
    {
      header: "Course Name",
      key: "courseName",
      sortable: true,
      render: (row: Enrollment) => row.courseName || "-",
      filterType: "text",
      },
    {
      header: "Start Date",
      key: "startDate",
      render: (row: Enrollment) =>
        row.startDate ? new Date(row.startDate).toLocaleDateString() : "-",
      sortable: true,
    },
    {
      header: "Status",
      key: "status",
      filterType: "select",
      filterOptions: [
        { value: "active", label: "Active" },
        { value: "close", label: "Close" },
        { value: "changed", label: "Changed" },
      ],
      render: (row: Enrollment) => {
        const status = row.status || "active";
        const statusColor =
          status === "active"
            ? "bg-green-100 text-green-800"
            : status === "inactive"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-blue-100 text-blue-800";
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      header: "Amount",
      key: "committedAmount",
      render: (row: Enrollment) =>
        `Rs. ${Number(row.committedAmount)?.toFixed(2) || "0.00"}`,
      sortable: true,
    },
  ];

  return (
    <div>
      <DataTable<Enrollment>
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
        onDelete={(enrollmentId: number | undefined) => {
          setDeleteId(enrollmentId ?? null);
          setDeleteOpen(true);
        }}
        idKey={"enrollmentId"}
      />
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Enrollment?"
        description="Are you sure you want to delete this enrollment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
