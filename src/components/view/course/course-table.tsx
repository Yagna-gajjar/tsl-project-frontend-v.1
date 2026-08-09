import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getCourses, deleteCourse, type CourseQuery } from "@/api/course.api";
import { getActivities } from "@/api/activity.api";
import { getEntities } from "@/api/entity.api";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";
import type { Course } from "@/types/course";

type Props = {
  onView?: (row: Course) => void;
  onEdit?: (row: Course) => void;
  refreshKey?: number;
};

type FilterValue = string | number | undefined;

export default function CourseTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, FilterValue>>({});
  const [sortBy, setSortBy] = useState<keyof Course>("courseId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Activity/Entity are matched exactly on the server, so the filter offers the
  // real list of names rather than a free-text box that silently matches nothing.
  const [activityOptions, setActivityOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [entityOptions, setEntityOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [actRes, entRes] = await Promise.all([
        getActivities({ limit: 1000 }),
        getEntities({ limit: 1000 }),
      ]);

      if (cancelled) return;

      // Names are not unique-constrained in the schema, so dedupe to keep the
      // <SelectItem> keys unique.
      const toOptions = (rows: Record<string, unknown>[], key: string) =>
        Array.from(
          new Set(
            rows.map((r) => String(r?.[key] ?? "").trim()).filter(Boolean)
          )
        )
          .sort((a, b) => a.localeCompare(b))
          .map((name) => ({ label: name, value: name }));

      setActivityOptions(
        toOptions(
          (actRes?.data ?? []) as unknown as Record<string, unknown>[],
          "activityName"
        )
      );
      setEntityOptions(
        toOptions(
          (entRes?.data ?? []) as unknown as Record<string, unknown>[],
          "entityName"
        )
      );
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const buildQuery = useCallback(
    (overrides: Partial<CourseQuery> = {}): CourseQuery => ({
      page,
      limit,
      search: search || undefined,
      sortBy,
      sortOrder,
      courseName: filters.courseName as string | undefined,
      courseType: filters.courseType as string | undefined,
      classification: filters.classification as string | undefined,
      activityName: filters.activityName as string | undefined,
      entityName: filters.entityName as string | undefined,
      status: filters.status as string | undefined,
      chargingPattern: filters.chargingPattern as string | undefined,
      introduceDate: filters.introduceDate as string | undefined,
      ...overrides,
    }),
    [page, limit, search, sortBy, sortOrder, filters]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res: Response<Course[]> = await getCourses(buildQuery());

      setData(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch {
      toast({ title: "Failed to load courses", variant: "destructive" });
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handleFilterChange = (key: string, value: FilterValue) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const handleExport = async (): Promise<Course[]> => {
    const res: Response<Course[]> = await getCourses(
      buildQuery({ page: 1, limit: total || 1000 })
    );
    return Array.isArray(res?.data) ? res.data : [];
  };

  const columns = useMemo<Column<Course>[]>(
    () => [
      { header: "ID", key: "courseId", sortable: true },
      {
        header: "Course Name",
        key: "courseName",
        sortable: true,
        filterType: "text",
      },
      { header: "Type", key: "courseType", sortable: true, filterType: "text" },
      {
        header: "Classification",
        key: "classification",
        sortable: true,
        filterType: "text",
      },
      {
        header: "Activity",
        key: "activityName",
        sortable: true,
        filterType: "select",
        filterOptions: activityOptions,
      },
      {
        header: "Entity",
        key: "entityName",
        sortable: true,
        filterType: "select",
        filterOptions: entityOptions,
      },
      {
        header: "Status",
        key: "status",
        sortable: true,
        filterType: "select",
        filterOptions: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ],
        render: (r) => (
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${r.status === 'active'
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
        filterType: "select",
        filterOptions: [
          { label: "Unit", value: "Unit" },
          { label: "Day", value: "Day" },
          { label: "Session", value: "Session" },
          { label: "School", value: "School" },
        ],
      },
      {
        header: "Intro Date",
        key: "introduceDate",
        render: (r) => r.introduceDate ? new Date(r.introduceDate).toLocaleDateString() : "N/A",
        sortable: true,
        filterType: "date",
      },
    ],
    [activityOptions, entityOptions]
  );

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
        onFilterChange={handleFilterChange}
        onSortChange={(c, d) => {
          setSortBy(c as keyof Course);
          setSortOrder(d);
          setPage(1);
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
