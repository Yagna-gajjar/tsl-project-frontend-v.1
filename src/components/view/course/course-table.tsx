import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getCoursePackages, deleteCoursePackage } from "@/api/coursePackage.api";
import type { CoursePackage } from "@/types/coursePackage";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";

type Props = {
  onView?: (row: CoursePackage) => void;
  onEdit?: (row: CoursePackage) => void;
  refreshKey?: number;
};

export default function CoursePackageTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<CoursePackage[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<keyof CoursePackage>("coursePackageId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res: Response<CoursePackage[]> = await getCoursePackages({
        page,
        limit,
        search: search || undefined,
        sortBy,
        sortOrder,
      });

      setData(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch {
      toast({ title: "Failed to load course packages", variant: "destructive" });
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handleExport = async (): Promise<CoursePackage[]> => {
    const res: Response<CoursePackage[]> = await getCoursePackages({
      page: 1,
      limit: total,
      search: search || undefined,
      sortBy,
      sortOrder,
    });

    return Array.isArray(res?.data) ? res.data : [];
  };

  const columns: Column<CoursePackage>[] = [
    { header: "ID", key: "coursePackageId", sortable: true },
    { header: "Course Name", key: "courseName", sortable: true },
    { header: "Batch Name", key: "batchName", sortable: true },
    { header: "Link Type", key: "linkType", sortable: true },
    {
      header: "Status",
      key: "status",
      render: (r) => (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
          {r.status}
        </span>
      )
    },
    {
      header: "Approval Authority",
      key: "authorityFirstName",
      render: (r) => r.memberFirstName
        ? `${r.memberFirstName} ${r.memberLastName || ""}`
        : "N/A"
    },
    {
      header: "Created At",
      key: "createdAt",
      render: (r) => new Date(r.createdAt as string).toLocaleDateString(),
      sortable: true,
    },
  ];

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
        onSortChange={(c, d) => {
          setSortBy(c as keyof CoursePackage);
          setSortOrder(d);
        }}
        onView={onView}
        onEdit={onEdit}
        onDelete={(id) => {
          setDeleteId(id ?? null);
          setDeleteOpen(true);
        }}
        idKey="coursePackageId"
        exportFileName="CoursePackages"
        onExport={handleExport}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Course Package?"
        description="This action will remove the link between this course and batch. It cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteCoursePackage(deleteId);
            toast({ title: "Course package deleted" });
            setDeleteOpen(false);
            loadData();
          } catch (err: any) {
            toast({ title: "Deletion failed", description: err.message, variant: "destructive" });
          }
        }}
      />
    </>
  );
}
