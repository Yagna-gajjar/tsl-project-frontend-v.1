import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

import {
  getCoursePackages,
  deleteCoursePackage,
  type CoursePackageQuery,
} from "@/api/coursePackage.api";

import type { CoursePackage } from "@/types/coursePackage";
import type { Response } from "@/types/response";

type Props = {
  onView: (row: CoursePackage) => void;
  refreshKey?: number;
};

type FilterValue = string | number | undefined;

export default function CoursePackageTable({
  onView,
  refreshKey,
}: Props) {
  const [data, setData] = useState<CoursePackage[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, FilterValue>>({});
  const [sortBy, setSortBy] = useState<string>("coursePackageId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const buildQuery = useCallback(
    (overrides: Partial<CoursePackageQuery> = {}): CoursePackageQuery => ({
      page,
      limit,
      search: search || undefined,
      sortBy,
      sortOrder,
      courseName: filters.courseName as string | undefined,
      batchName: filters.batchName as string | undefined,
      linkType: filters.linkType as string | undefined,
      status: filters.status as string | undefined,
      authorityName: filters.authorityName as string | undefined,
      ...overrides,
    }),
    [page, limit, search, sortBy, sortOrder, filters]
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res: Response<CoursePackage[]> = await getCoursePackages(
        buildQuery()
      );

      setData(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load course packages",
        variant: "destructive",
      });
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

  const columns = useMemo<Column<CoursePackage>[]>(
    () => [
      { header: "Package ID", key: "coursePackageId", sortable: true },
      {
        header: "Course Name",
        key: "courseName",
        sortable: true,
        filterType: "text",
      },
      {
        header: "Batch Name",
        key: "batchName",
        sortable: true,
        filterType: "text",
        render: (r) => r.batchName || "-",
      },
      {
        header: "Link Type",
        key: "linkType",
        sortable: true,
        filterType: "select",
        filterOptions: [
          { label: "Pre", value: "Pre" },
          { label: "Post", value: "Post" },
        ],
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
          <span className="capitalize px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {r.status || 'Active'}
          </span>
        )
      },
      {
        header: "Approval Authority",
        key: "authorityName",
        sortable: true,
        filterType: "text",
        render: (r) => r.authorityName || "N/A",
      },
    ],
    []
  );

  const handleExport = async (): Promise<CoursePackage[]> => {
    const res: Response<CoursePackage[]> = await getCoursePackages(
      buildQuery({ page: 1, limit: total || 1000 })
    );

    return Array.isArray(res?.data) ? res.data : [];
  };

  return (
    <>
      <DataTable<CoursePackage>
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
          setSortBy(c);
          setSortOrder(d);
          setPage(1);
        }}
        onView={onView}
        onDelete={(id) => {
          setDeleteId(id ?? null);
          setDeleteOpen(true);
        }}
        idKey="coursePackageId"
        exportFileName="CoursePackages_Export"
        onExport={handleExport}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Course Package?"
        description="Are you sure you want to delete this mapping? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteCoursePackage(deleteId);
            toast({ title: "Deleted successfully" });
            setDeleteOpen(false);
            loadData();
          } catch (err: any) {
            toast({
              title: "Delete Failed",
              description: err.message,
              variant: "destructive"
            });
          }
        }}
      />
    </>
  );
}
