import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getCourseRates, deleteCourseRate } from "@/api/courseRate.api";
import type { CourseRate } from "@/types/courseRate";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";

type Props = {
  onView?: (row: CourseRate) => void;
  refreshKey?: number;
  filterCourseId?: number;
};

export default function CourseRateTable({
  onView,
  refreshKey,
  filterCourseId,
}: Props) {
  const [data, setData] = useState<CourseRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<
    Record<string, string | number | undefined>
  >({});
  const [sortBy, setSortBy] = useState<keyof CourseRate>("courseRateId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const handleExport = async (): Promise<CourseRate[]> => {
    const res: Response<CourseRate[]> = await getCourseRates({
      page: 1,
      limit: total,
      sortBy,
      sortOrder,
      search: search || undefined,
    });

    return Array.isArray(res?.data) ? res.data : [];
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res: Response<CourseRate[]> = await getCourseRates({
        page,
        limit,
        search: search || undefined,
        sortBy,
        sortOrder,
        courseId: filterCourseId,
        // entityType: filters.entityType as string | undefined,
        courseName: filters.courseName as string | undefined,
      });

      setData(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch {
      toast({ title: "Failed to load rates", variant: "destructive" });
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sortBy, sortOrder, filterCourseId, filters]);

  const handleFilterChange = async (
    filterKey: string,
    value: string | number | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value || undefined }));
    setPage(1);
  };

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [filterCourseId]);

  const columns: Column<CourseRate>[] = [
    {
      header: "Course Name",
      key: "courseId",
      render: (r) => `${r.courseName}`,
      sortable: true,
      filterType: "text",
    },
    // {
    //   header: "Entity Type",
    //   key: "entityType",
    //   sortable: true,
    //   filterType: "text",
    // },
    {
      header: "Rate",
      key: "unitRate",
      render: (r) => `₹${r.unitRate}`,
      sortable: true,
      filterType: "number",
    },
    { header: "Above Units", key: "aboveUnits", sortable: true },
    { header: "Freezing", key: "enrFreezingAllowed", sortable: true },
    {
      header: "Effective Date",
      key: "introduceDate",
      render: (r) => new Date(r.introduceDate).toLocaleDateString(),
      sortable: true,
    }
  ];

  return (
    <>
      <DataTable<CourseRate>
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
          setSortBy(c as keyof CourseRate);
          setSortOrder(d);
        }}
        onView={onView}
        onDelete={(id) => {
          setDeleteId(id ?? null);
          setDeleteOpen(true);
        }}
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        idKey="courseRateId"
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Rate?"
        description="This will permanently delete this pricing configuration."
        confirmText="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteCourseRate(deleteId);
          toast({ title: "Rate deleted" });
          setDeleteOpen(false);
          loadData();
        }}
      />
    </>
  );
}