import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

import {
  getCoursePackages,
  deleteCoursePackage,
} from "@/api/coursePackage.api";

import type { CoursePackage } from "@/types/coursePackage";
import type { Response } from "@/types/response";

type Props = {
  onView: (row: CoursePackage) => void;
  onEdit: (row: CoursePackage) => void;
  refreshKey?: number;
};

export default function CoursePackageTable({
  onView,
  onEdit,
  refreshKey,
}: Props) {
  const [data, setData] = useState<CoursePackage[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res: Response<CoursePackage[]> = await getCoursePackages({
        page,
        limit,
      });

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
  }, [page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const columns: Column<CoursePackage>[] = [
    { header: "Package ID", key: "coursePackageId" },
    { header: "Course Name", key: "courseName" },
    { header: "Batch Name", key: "batchName" }, // Changed from activityType
    { header: "Link Type", key: "linkType" },
    {
      header: "Status",
      key: "status",
      render: (r) => (
        <span className="capitalize px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {r.status || 'Active'}
        </span>
      )
    },
    {
      header: "Approval Authority",
      key: "authorityFirstName",
      render: (r) => r.memberFirstName
        ? `${r.memberFirstName} ${r.memberLastName || ""}`.trim()
        : "N/A"
    },
  ];

  const handleExport = async (): Promise<CoursePackage[]> => {
    const res: Response<CoursePackage[]> = await getCoursePackages({
      page: 1,
      limit: total,
    });

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
        onView={onView}
        onEdit={onEdit}
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