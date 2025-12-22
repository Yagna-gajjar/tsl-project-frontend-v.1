import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";

import {
  getMembershipLinks,
  deleteMembershipLink,
} from "@/api/membershipLink.api";
import type { MembershipLink } from "@/types/membershipLink";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";

type Props = {
  onView?: (row: MembershipLink) => void;
  onEdit?: (row: MembershipLink) => void;
  refreshKey?: number;
};

export default function MembershipLinkTable({
  onView,
  onEdit,
  refreshKey,
}: Props) {
  const [data, setData] = useState<MembershipLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: Response<MembershipLink[]> = await getMembershipLinks({
        page,
        limit,
      });

      setTotal(res.pagination.total);
      setData(res.data || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch membership links",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const columns: Column<MembershipLink>[] = [
    { key: "membershipType", header: "Membership Master" },
    { key: "membershipName", header: "Membership" },
    { key: "accountName", header: "Account" },
    {
      key: "linkDate",
      header: "Link Date",
    },
    {
      key: "dLinkDate",
      header: "D-Link Date",
    },
  ];

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number>();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMembershipLink(deleteId);
      toast({
        title: "Deleted",
        description: "Membership link deleted",
        variant: "success",
      });
      loadData();
    } catch {
      toast({
        title: "Error",
        description: "Delete failed",
        variant: "destructive",
      });
    } finally {
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          limit,
          total,
          onPageChange: setPage,
        }}
        onView={onView}
        onEdit={onEdit}
        onDelete={(id) => {
          setDeleteId(id);
          setDeleteOpen(true);
        }}
        idKey="membershipLinkId"
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Membership Link?"
        description="This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </>
  );
}
