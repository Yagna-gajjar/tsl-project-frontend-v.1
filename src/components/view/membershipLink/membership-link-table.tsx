import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";

import {
  getMembershipLinks,
  deleteMembershipLink,
} from "@/api/membershipLink.api";

import type { MembershipLink } from "@/types/membershipLink";
import type { Response } from "@/types/response";

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type MembershipData = {
  membershipMasterId?: number;
  membershipTypeName: string;
  membershipId?: number;
};

type Props = {
  onView?: (row: MembershipLink) => void;
  onEdit?: (row: MembershipLink) => void;
  refreshKey?: number;
  membershipData: MembershipData;
};

export default function MembershipLinkTable({
  onView,
  onEdit,
  refreshKey,
  membershipData = {
    membershipMasterId: 0,
    membershipTypeName: "",
    membershipId: 0,
  },
}: Props) {
  const { membershipMasterId, membershipId } = membershipData;

  const [data, setData] = useState<MembershipLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);

  const [hideDeLinked, setHideDeLinked] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const res: Response<MembershipLink[]> = await getMembershipLinks({
        page,
        limit,
        hideDeLinked,
        membershipMasterId: membershipMasterId ? membershipMasterId : undefined,
        membershipId: membershipId ? membershipId : undefined,
      });

      setData(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch membership links",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, hideDeLinked, membershipMasterId, membershipId]);

  useEffect(() => {
    setPage(1); // reset page on filter change
  }, [hideDeLinked, membershipMasterId, membershipId]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | undefined>();

  const handleDelete = async () => {
    if (deleteId === undefined) return;

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
      setDeleteId(undefined);
    }
  };

  const columns: Column<MembershipLink>[] = [
    { key: "membershipType", header: "Membership Master" },
    { key: "membershipId", header: "Membership" },
    { key: "accountName", header: "Account" },
    { key: "linkDate", header: "Link Date" },
    { key: "dLinkDate", header: "D-Link Date" },
  ];

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Checkbox
          id="hide-delinked"
          checked={hideDeLinked}
          onCheckedChange={(v) => setHideDeLinked(Boolean(v))}
        />
        <Label htmlFor="hide-delinked">Hide De-Linked</Label>
      </div>

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
