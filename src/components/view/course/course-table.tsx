import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getCourses, deleteCourse } from "@/api/course.api";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";
import type { Course } from "@/types/course";

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
    { header: "ID", key: "courseId", sortable: true },
    { header: "Course Name", key: "courseName", sortable: true },
    { header: "Type", key: "courseType", sortable: true },
    { header: "Classification", key: "classification", sortable: true },
    { header: "Activity", key: "activityName", sortable: true },
    { header: "Entity", key: "entityName", sortable: true },
    {
      header: "Status",
      key: "status",
      render: (r) => (
        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${r.status === 'active'
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
          : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
          }`}>
          {r.status}
        </span>
      )
    },
    {
      header: "Charging",
      key: "chargingPattern",
      sortable: true,
    },
    {
      header: "Intro Date",
      key: "introduceDate",
      render: (r) => r.introduceDate ? new Date(r.introduceDate).toLocaleDateString() : "N/A",
      sortable: true,
    },
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
        idKey="courseId" // Changed from coursePackageId
        exportFileName="Courses"
        onExport={handleExport}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Course?"
        description="This action will permanently remove this course and all associated configurations. It cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteCourse(deleteId);
            toast({ title: "Course deleted successfully" });
            setDeleteOpen(false);
            loadData();
          } catch (err: any) {
            toast({
              title: "Deletion failed",
              description: err.message || "An error occurred",
              variant: "destructive"
            });
          }
        }}
      />
    </>
  );
}