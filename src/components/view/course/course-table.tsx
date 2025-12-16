import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getCourses, deleteCourse } from "@/api/course.api";
import type { Course } from "@/types/course";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";

type Props = {
  onView?: (row: Course) => void;
  onEdit?: (row: Course) => void;
  refreshKey?: number;
};

export default function CourseTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<keyof Course>("courseId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res: Response<Course[]> = await getCourses({
        page,
        limit,
        search: search || undefined,
        sortBy,
        sortOrder,
      });

      setData(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch {
      toast({ title: "Failed to load courses", variant: "destructive" });
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handleExport = async (): Promise<Course[]> => {
    const res: Response<Course[]> = await getCourses({
      page: 1,
      limit: total,
      search: search || undefined,
      sortBy,
      sortOrder,
    });

    return Array.isArray(res?.data) ? res.data : [];
  };

  const columns: Column<Course>[] = [
    { header: "Course Name", key: "courseName", sortable: true },
    { header: "Activity", key: "activityName" },
    { header: "Course Type", key: "courseType" },
    {
      header: "Introduce Date",
      key: "introduceDate",
      render: (r) => new Date(r.introduceDate).toLocaleDateString(),
      sortable: true,
    },
    { header: "Session (min)", key: "sessionMinutes" },
    { header: "Days / Week", key: "noOfDaysInWeek" },
    { header: "Batch Capacity", key: "batchCapacity" },
    {
      header: "Age Range",
      key: "minAge",
      render: (r) => `${r.minAge} - ${r.maxAge}`,
    },
    { header: "Gender", key: "gender" },
    { header: "Freezing Allowed", key: "freezingAllowed" },
  ];

  return (
    <>
      <DataTable<Course>
        data={data}
        columns={columns}
        isLoading={loading}
        pagination={{
          page,
          limit,
          total,
          onPageChange: setPage,
        }}
        onSearchChange={(q) => {
          setSearch(q);
          setPage(1);
        }}
        onSortChange={(c, d) => {
          setSortBy(c as keyof Course);
          setSortOrder(d);
        }}
        onView={onView}
        onEdit={onEdit}
        onDelete={(id) => {
          setDeleteId(id ?? null);
          setDeleteOpen(true);
        }}
        idKey="courseId"
        exportFileName="Courses"
        onExport={handleExport}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Course?"
        description="This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteCourse(deleteId);
          toast({ title: "Course deleted" });
          setDeleteOpen(false);
          loadData();
        }}
      />
    </>
  );
}
