import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";

import {
  getMembershipLinks,
  deleteMembershipLink,
} from "@/api/membershipLink.api";
import { getMembershipMasters } from "@/api/membershipMaster.api";
import { getEnumsByCategory } from "@/api/enums.api";
import { getMemberships } from "@/api/membership.api";

import type { MembershipLink } from "@/types/membershipLink";
import type { MembershipMaster } from "@/types/memberShipMaster";
import type { Enums } from "@/types/enums";
import type { membership } from "@/types/membership";
import type { Response } from "@/types/response";

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SearchableMultiselect } from "@/components/form-modal/form-field-input";

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

  const [entities, setEntities] = useState<membership[]>([]);
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

  /* ---------------- FETCH MEMBERSHIP MASTERS ---------------- */

  const fetchMasters = useCallback(
    async (isInitial = false) => {
      if (loadingMembershipMasters) return;
      if (!isInitial && !hasMoreMembershipMasters) return;

      setLoadingMembershipMasters(true);
      try {
        const pageToLoad = isInitial ? 1 : membershipMastersPage;

        const response: Response<MembershipMaster[]> =
          await getMembershipMasters({
            limit: PAGE_SIZE,
            page: pageToLoad,
            entityType:
              entityType.toLowerCase() !== "all" ? entityType : undefined,
          });

        const items = response?.data || [];

        setMembershipMasters((prev) =>
          isInitial ? items : [...prev, ...items]
        );
        setHasMoreMembershipMasters(items.length === PAGE_SIZE);
        setMembershipMastersPage(pageToLoad + 1);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch membership masters",
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

  /* ---------------- FETCH ENTITIES ---------------- */

  const fetchEntities = useCallback(
    async (isInitial = false) => {
      if (loadingEntities) return;
      if (!isInitial && !hasMoreEntities) return;

      setLoadingEntities(true);
      try {
        const pageToLoad = isInitial ? 1 : entitiesPage;

        const response: Response<membership[]> = await getMemberships({
          limit: PAGE_SIZE,
          page: pageToLoad,
          membershipMasterId:
            membershipMasterId !== "all"
              ? Number(membershipMasterId)
              : undefined,
          billingEntityOfFamily: "Members",
        });

        const items = response?.data || [];

        setEntities((prev) => (isInitial ? items : [...prev, ...items]));
        setHasMoreEntities(items.length === PAGE_SIZE);
        setEntitiesPage(pageToLoad + 1);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch entities",
          variant: "destructive",
        });
      } finally {
        setLoadingEntities(false);
      }
    },
    [loadingEntities, hasMoreEntities, entitiesPage, membershipMasterId]
  );

  /* ---------------- INITIAL LOAD ---------------- */

  useEffect(() => {
    const fetchEntityTypes = async () => {
      const res: Response<Enums[]> = await getEnumsByCategory("ENTITY TYPE");
      setEntityTypeEnums(res.data || []);
    };

    fetchMasters(true);
    fetchEntities(true);
    fetchEntityTypes();
  }, []);

  /* ---------------- REFRESH ON FILTER CHANGE ---------------- */

  useEffect(() => {
    // reset masters
    setMembershipMasters([]);
    setMembershipMastersPage(1);
    setHasMoreMembershipMasters(true);
    fetchMasters(true);

    // reset entities (THIS WAS MISSING)
    setEntities([]);
    setEntitiesPage(1);
    setHasMoreEntities(true);
    fetchEntities(true);

    setPage(1);
  }, [entityType, membershipMasterId]);

  /* ---------------- TABLE DATA ---------------- */

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

  /* ---------------- DELETE ---------------- */

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

  /* ---------------- COLUMNS ---------------- */

  const columns: Column<MembershipLink>[] = [
    { key: "membershipType", header: "Membership Master" },
    { key: "membershipId", header: "Membership" },
    { key: "accountName", header: "Account" },
    { key: "linkDate", header: "Link Date" },
    { key: "dLinkDate", header: "D-Link Date" },
  ];

  /* ---------------- UI ---------------- */

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
              ...entityTypeEnums
                .filter((e) => ![2, 5, 6].includes(e.enumCase))
                .map((e) => ({
                  label: e.value,
                  value: e.value,
                })),
            ]}
            onChange={(val) => setEntityType(val ?? "all")}
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
            onChange={(val) => setMembershipMasterId(val ?? "all")}
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
            onChange={(val) => setEntityId(val ?? "all")}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            checked={hideDeLinked}
            onCheckedChange={(v) => setHideDeLinked(!!v)}
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
