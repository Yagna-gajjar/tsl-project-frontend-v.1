import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

import { getCourseShares, deleteCourseShare } from "@/api/courseShare.api";

import type { CourseShare } from "@/types/courseShare";
import type { Response } from "@/types/response";

type Props = {
  onView: (row: CourseShare) => void;
  refreshKey?: number;
};

export default function CourseShareTable({
  onView,
  refreshKey,
}: Props) {
  const [data, setData] = useState<CourseShare[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res: Response<CourseShare[]> = await getCourseShares({
        page,
        limit,
      });

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
  }, [page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const columns: Column<CourseShare>[] = [
    { header: "Share ID", key: "courseShareId" },
    { header: "Role", key: "roleInCourse" },
    { header: "Course", key: "courseName" },
    { header: "Account", key: "accountName" },
    {
      header: "Approval Authority",
      key: "approvalAuthorityId",
      render: (r: CourseShare | any) =>
        r.memberFirstName
          ? `${r.memberFirstName} ${r.memberLastName ?? ""}`
          : "-",
    },
    { header: "Share (%)", key: "share", render: (r) => `${r.share}%` },
    { header: "CGST (%)", key: "cgst", render: (r) => `${r.cgst}%` },
    { header: "SGST (%)", key: "sgst", render: (r) => `${r.sgst}%` },
    { header: "Status", key: "status" },
  ];

  const handleExport = async (): Promise<CourseShare[]> => {
    const res: Response<CourseShare[]> = await getCourseShares({
      page: 1,
      limit: total,
    });

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
