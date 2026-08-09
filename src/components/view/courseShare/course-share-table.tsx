import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

import {
  getCourseShares,
  deleteCourseShare,
  type CourseShareQuery,
} from "@/api/courseShare.api";

import type { CourseShare } from "@/types/courseShare";
import type { Response } from "@/types/response";

type Props = {
  onView: (row: CourseShare) => void;
  refreshKey?: number;
};

type FilterValue = string | number | undefined;

export default function CourseShareTable({
  onView,
  refreshKey,
}: Props) {
  const [data, setData] = useState<CourseShare[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, FilterValue>>({});
  const [sortBy, setSortBy] = useState<string>("courseShareId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const buildQuery = useCallback(
    (overrides: Partial<CourseShareQuery> = {}): CourseShareQuery => ({
      page,
      limit,
      search: search || undefined,
      sortBy,
      sortOrder,
      roleInCourse: filters.roleInCourse as string | undefined,
      courseName: filters.courseName as string | undefined,
      accountName: filters.accountName as string | undefined,
      authorityName: filters.authorityName as string | undefined,
      minShare: filters.share,
      status: filters.status as string | undefined,
      ...overrides,
    }),
    [page, limit, search, sortBy, sortOrder, filters]
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res: Response<CourseShare[]> = await getCourseShares(buildQuery());

      setData(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load course shares",
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

  const columns = useMemo<Column<CourseShare>[]>(
    () => [
      { header: "Share ID", key: "courseShareId", sortable: true },
      {
        header: "Role",
        key: "roleInCourse",
        sortable: true,
        filterType: "text",
      },
      {
        header: "Course",
        key: "courseName",
        sortable: true,
        filterType: "text",
      },
      {
        header: "Account",
        key: "accountName",
        sortable: true,
        filterType: "text",
      },
      {
        header: "Approval Authority",
        key: "authorityName",
        sortable: true,
        filterType: "text",
        render: (r) => r.authorityName || "-",
      },
      {
        header: "Share (%)",
        key: "share",
        sortable: true,
        filterType: "number",
        filterPlaceholder: "Minimum share %",
        render: (r) => `${r.share}%`,
      },
      {
        header: "CGST (%)",
        key: "cgst",
        sortable: true,
        render: (r) => `${r.cgst}%`,
      },
      {
        header: "SGST (%)",
        key: "sgst",
        sortable: true,
        render: (r) => `${r.sgst}%`,
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
          <span className="capitalize">{r.status || "-"}</span>
        ),
      },
    ],
    []
  );

  const handleExport = async (): Promise<CourseShare[]> => {
    const res: Response<CourseShare[]> = await getCourseShares(
      buildQuery({ page: 1, limit: total || 1000 })
    );

    return Array.isArray(res?.data) ? res.data : [];
  };

  return (
    <>
      <DataTable<CourseShare>
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
        idKey="courseShareId"
        exportFileName="CourseShare"
        onExport={handleExport}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Course Share?"
        description="This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteId) return;
          await deleteCourseShare(deleteId);
          toast({ title: "Deleted successfully" });
          setDeleteOpen(false);
          loadData();
        }}
      />
    </>
  );
}
