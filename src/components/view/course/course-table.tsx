import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getCourses, deleteCourse } from "@/api/course.api";
import type { Course } from "@/types/course";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
type Props = {
  onView?: (row: Course) => void;
  onEdit?: (row: Course) => void;
  refreshKey?: number;
};

export default function CourseTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<
    Record<string, string | number | undefined>
  >({});
  const [sortBy, setSortBy] = useState<string>("courseId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getCourses({
        page,
        limit,
        sortBy,
        sortOrder: sortOrder,
        search: search || undefined,
        academyId: filters.academyId as number | undefined,
        activityId: filters.activityId as number | undefined,
        courseName: filters.courseName as string | undefined,
        status: filters.status as string | undefined,
      });

      const rowsRaw = Array.isArray(res)
        ? res
        : Array.isArray((res as Record<string, unknown>)?.data)
        ? ((res as Record<string, unknown>).data as Course[])
        : [];
      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      })) as Course[];

      setData(rows);
    } catch {
      console.error("Failed to fetch courses");
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
      await deleteCourse(deleteId);
      setData((prev) => prev.filter((c) => c.courseId !== deleteId));
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
      setDeleteOpen(false);
      setDeleteId(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  const columns: Column<Course>[] = [
    {
      header: "Course Name",
      key: "courseName",
      render: (row: Course) => row.courseName || "-",
      sortable: true,
      filterType: "text",
    },
    {
      header: "Academy Name",
      key: "academyName",
      render: (row: Course) => row.academyName || "-",
      sortable: true,
      filterType: "text",
    },
    {
      header: "Activity Name",
      key: "activityName",
      render: (row: Course) => row.activityName || "-",
      sortable: true,
      filterType: "text",
    },
    {
      header: "Introduction Date",
      key: "introductionDate",
      render: (row: Course) =>
        row.introductionDate ? row.introductionDate.toDateString() : "-",
      sortable: true,
      hidden: true,
    },
    {
      header: "Course Type",
      key: "typeOfCourse",
      render: (row: Course) => row.typeOfCourse || "-",
      filterType: "text",
    },
    {
      header: "Min Enrollment Unit",
      key: "minEnrollmentUnit",
      render: (row: Course) => row.minEnrollmentUnit || "-",
      hidden: true,
    },
    {
      header: "Total Parallel Batches",
      key: "totalParallelBatches",
      render: (row: Course) => row.totalParallelBatches || "-",
      hidden: true,
    },
    {
      header: "Classification Type",
      key: "classificationType",
      render: (row: Course) => row.classificationType || "-",
    },
    {
      header: "Charging Pattern",
      key: "chargingPattern",
      render: (row: Course) => row.chargingPattern || "-",
    },
    {
      header: "Session Minutes",
      key: "sessionMinutes",
      render: (row: Course) => row.sessionMinutes || "-",
    },
    {
      header: "No. Of Days In Week",
      key: "noOfDaysInWeek",
      render: (row: Course) => row.noOfDaysInWeek || "-",
    },
    {
      header: "Week Days",
      key: "weekDays",
      render: (row: Course) => row.weekDays || "-",
    },
    {
      header: "Unit Rate",
      key: "unitRate",
      render: (row: Course) => row.unitRate || "-",
    },
    {
      header: "Batch Capacity",
      key: "batchCapacity",
      render: (row: Course) => row.batchCapacity || "-",
    },
    {
      header: "Age Range",
      key: "minAge",
      render: (row: Course) => row.minAge + " - " + row.maxAge || "-",
    },
    {
      header: "Gender",
      key: "gender",
      render: (row: Course) => row.gender || "-",
    },
    {
      header: "Status",
      key: "status",
      render: (row: Course) => row.status || "-",
    },
  ];

  return (
    <div>
      <DataTable<Course>
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
        onDelete={(courseId: number | undefined) => {
          setDeleteId(courseId ?? null);
          setDeleteOpen(true);
        }}
        idKey={"courseId"}
      />
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Course?"
        description="Are you sure you want to delete this course? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
