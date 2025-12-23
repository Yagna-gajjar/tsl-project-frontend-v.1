import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";

import {
  getMembershipLinks,
  deleteMembershipLink,
} from "@/api/membershipLink.api";
import { getMembershipMasters } from "@/api/membershipMaster.api";
import { getEnumsByCategory } from "@/api/enums.api";
import { getEntities } from "@/api/entity.api";

import type { MembershipLink } from "@/types/membershipLink";
import type { MembershipMaster } from "@/types/memberShipMaster";
import type { Enums } from "@/types/enums";
import type { Entity } from "@/types/entity";

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SearchableMultiselect } from "@/components/form-modal/form-field-input";
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

  const [membershipMasterId, setMembershipMasterId] = useState<string>("all");
  const [membershipType, setMembershipType] = useState<string>("all");
  const [entityType, setEntityType] = useState<string>("all");
  const [entityId, setEntityId] = useState<string>("all");
  const [hideDeLinked, setHideDeLinked] = useState(false);

  const [entities, setEntities] = useState<Entity[]>([]);

  const [entitiesPage, setEntitiesPage] = useState(1);
  const [hasMoreEntities, setHasMoreEntities] = useState(true);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [membershipMasters, setMembershipMasters] = useState<
    MembershipMaster[]
  >([]);

  const [membershipMastersPage, setMembershipMastersPage] = useState(1);
  const [hasMoreMembershipMasters, setHasMoreMembershipMasters] =
    useState(true);
  const [loadingMembershipMasters, setLoadingMembershipMasters] =
    useState(false);
  const [entityTypeEnums, setEntityTypeEnums] = useState<Enums[]>([]);

  const PAGE_SIZE = 20;

  const fetchMasters = useCallback(
    async (isInitial = false) => {
      if (loadingMembershipMasters || (!hasMoreMembershipMasters && !isInitial))
        return;
      setLoadingMembershipMasters(true);
      try {
        const page = isInitial ? 1 : membershipMastersPage;

        const response: Response<MembershipMaster[]> =
          await getMembershipMasters({
            limit: PAGE_SIZE,
            page,
            entityType:
              entityType.toLocaleLowerCase() !== "all" ? entityType : undefined,
          });
        const items = response?.data || ([] as MembershipMaster[]);
        setMembershipMasters((prev) =>
          isInitial ? items : [...prev, ...items]
        );
        setHasMoreMembershipMasters(items.length === PAGE_SIZE);
        setMembershipMastersPage(page + 1);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch members",
          variant: "destructive",
        });
      } finally {
        setLoadingMembershipMasters(false);
      }
    },
    [
      loadingMembershipMasters,
      hasMoreMembershipMasters,
      membershipMastersPage,
      entityType,
    ]
  );

  const fetchEntities = useCallback(
    async (isInitial = false) => {
      if (loadingEntities || (!hasMoreEntities && !isInitial)) return;
      setLoadingEntities(true);
      try {
        const page = isInitial ? 1 : entitiesPage;
        const response: Response<Entity[]> = await getEntities({
          limit: PAGE_SIZE,
          page,
          entityType:
            entityType.toLocaleLowerCase() !== "all" ? entityType : undefined,
        });
        const items = response?.data || ([] as Entity[]);
        setEntities((prev) => (isInitial ? items : [...prev, ...items]));
        setHasMoreEntities(items.length === PAGE_SIZE);
        setEntitiesPage(page + 1);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch members",
          variant: "destructive",
        });
      } finally {
        setLoadingEntities(false);
      }
    },
    [loadingEntities, hasMoreEntities, entitiesPage, entityType]
  );

  useEffect(() => {
    const fetchEntityTypes = async () => {
      const res: Response<Enums[]> = await getEnumsByCategory("ENTITY TYPE");
      setEntityTypeEnums(res.data || []);
    };

    fetchMasters();
    fetchEntityTypes();
    fetchEntities();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const res: Response<MembershipLink[]> = await getMembershipLinks({
        page,
        limit,
        membershipMasterId:
          membershipMasterId !== "all" ? Number(membershipMasterId) : undefined,
        membershipType: membershipType !== "all" ? membershipType : undefined,
        entityType: entityType !== "all" ? entityType : undefined,
        entityId: entityId !== "all" ? Number(entityId) : undefined,
        hideDeLinked,
      });

      setData(res.data || []);
      setTotal(res.pagination.total);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch membership links",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    limit,
    membershipMasterId,
    membershipType,
    entityType,
    entityId,
    hideDeLinked,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  useEffect(() => {
    setMembershipMasters([]);
    setMembershipMastersPage(1);
    setHasMoreMembershipMasters(true);
    fetchMasters(true);
    fetchEntities(true)
  }, [entityType]);

  const columns: Column<MembershipLink>[] = [
    { key: "membershipType", header: "Membership Master" },
    { key: "membershipId", header: "Membership" },
    { key: "accountName", header: "Account" },
    { key: "linkDate", header: "Link Date" },
    { key: "dLinkDate", header: "D-Link Date" },
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
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <div className="w-2/3 flex gap-2">
          <SearchableMultiselect
            isSingle
            placeholder="Entity Type"
            value={entityType === "all" ? null : entityType}
            options={[
              { label: "All", value: "all" },
              ...entityTypeEnums.map((e) => ({
                label: e.value,
                value: e.value,
              })),
            ]}
            onChange={(val) => {
              setEntityType(val ?? "all");
              setPage(1);
            }}
          />

          <SearchableMultiselect
            isSingle
            placeholder="Membership Master"
            value={membershipMasterId === "all" ? null : membershipMasterId}
            options={[
              { label: "All", value: "all" },
              ...membershipMasters.map((m) => ({
                label: m.membershipType,
                value: Number(m.membershipMasterId),
              })),
            ]}
            onChange={(val) => {
              setMembershipMasterId(val ?? "all");
              setPage(1);
            }}
          />

          <SearchableMultiselect
            isSingle
            placeholder="Entity Name"
            value={entityId === "all" ? null : entityId}
            options={[
              { label: "All", value: "all" },
              ...entities.map((e) => ({
                label: e.entityName,
                value: Number(e.entityId),
              })),
            ]}
            onChange={(val) => {
              setEntityId(val ?? "all");
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            checked={hideDeLinked}
            onCheckedChange={(v) => {
              setHideDeLinked(!!v);
              setPage(1);
            }}
          />
          <Label>Hide De-Linked</Label>
        </div>
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
