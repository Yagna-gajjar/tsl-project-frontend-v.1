import { useCallback, useEffect, useState } from "react";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

import MembershipLinkTable from "@/components/view/membershipLink/membership-link-table";
import MembershipLinkFormModal from "@/components/view/membershipLink/membership-link-form-modal";
import MembershipLinkViewModal from "@/components/view/membershipLink/membership-link-view-modal";
import type { MembershipLink } from "@/types/membershipLink";
import MembershipLinkExcelUpload from "@/components/view/membershipLink/membershipLink-excel-upload";
import { SearchableMultiselect } from "@/components/form-modal/form-field-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Response } from "@/types/response";
import type { membership } from "@/types/membership";
import type { MembershipMaster } from "@/types/membershipMaster";
import type { Enums } from "@/types/enums";
import { getEnumsByCategory } from "@/api/enums.api";
import { getMembershipMasters } from "@/api/membershipMaster.api";
import { getMemberships } from "@/api/membership.api";
import { toast } from "@/hooks/use-toast";

export default function MembershipLinkPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [_, setEditRow] = useState<MembershipLink>();
  const [viewId, setViewId] = useState<number>();
  const [excelOpen, setExcelOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const bumpRefresh = () => setRefreshKey((s) => s + 1);
  const handleSaved = () => {
    bumpRefresh();
  };

  const PAGE_SIZE = 20;

  const [entityType, setEntityType] = useState<string>("all");
  const [membershipMasterId, setMembershipMasterId] = useState<string>("all");
  const [entityId, setEntityId] = useState<string>("all");
  const [hideDeLinked, setHideDeLinked] = useState(false);

  const [entityTypeEnums, setEntityTypeEnums] = useState<Enums[]>([]);
  const [membershipMasters, setMembershipMasters] = useState<
    MembershipMaster[]
  >([]);

  const [entities, setEntities] = useState<membership[]>([]);
  const [entitiesPage, setEntitiesPage] = useState(1);
  const [hasMoreEntities, setHasMoreEntities] = useState(true);
  const [loadingEntities, setLoadingEntities] = useState(false);

  const [membershipData, setMembershipData] = useState<{
    membershipId: number;
    membershipMasterId: number;
    membershipTypeName: string;
  }>();

  useEffect(() => {
    const fetchEntityTypes = async () => {
      const res: Response<Enums[]> = await getEnumsByCategory("ENTITY TYPE");
      setEntityTypeEnums(res.data || []);
    };

    fetchEntityTypes();
  }, []);

  useEffect(() => {
    const fetchMasters = async () => {
      const res: Response<MembershipMaster[]> = await getMembershipMasters({
        entityType: entityType !== "all" ? entityType : undefined,
      });

      setMembershipMasters(res.data || []);
    };

    fetchMasters();
  }, [entityType]);

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

  useEffect(() => {
    fetchEntities(true);
  }, []);

  useEffect(() => {
    setEntities([]);
    setEntitiesPage(1);
    setHasMoreEntities(true);
    fetchEntities(true);
  }, [membershipMasterId]);

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Membership Links</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setExcelOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <Upload className="w-5 h-5" />
            Upload Excel
          </Button>

          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Link
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <div className="w-1/4">
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
            onChange={(v) => setEntityType(v ?? "all")}
          />
        </div>

        <div className="w-1/4">
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
            onChange={(v) => {
              setMembershipMasterId(v ?? "all");

              const selected = membershipMasters.find(
                (m) => m.membershipMasterId === Number(v)
              );

              if (selected) {
                setMembershipData((prev) => ({
                  membershipId: prev?.membershipId ?? 0,
                  membershipMasterId: Number(selected.membershipMasterId),
                  membershipTypeName: selected.membershipType,
                }));
              }
            }}
          />
        </div>
        <div className="w-1/4">
          <SearchableMultiselect
            isSingle
            placeholder="Entity Name"
            value={entityId === "all" ? null : entityId}
            options={[
              { label: "All", value: "all" },
              ...entities.map((e) => ({
                label: e.entityName,
                value: e.entityId,
              })),
            ]}
            onChange={(v) => {
              setEntityId(v ?? "all");

              const selected = entities.find((e) => e.entityId === Number(v));

              if (selected) {
                setMembershipData((prev) => ({
                  membershipId: selected.membershipId,
                  membershipMasterId: prev?.membershipMasterId ?? 0,
                  membershipTypeName: prev?.membershipTypeName ?? "",
                }));
              }
            }}
            onLoadMore={() => fetchEntities()}
            isLoadingMore={loadingEntities}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={hideDeLinked}
            onCheckedChange={(v) => setHideDeLinked(!!v)}
          />
          <Label>Hide De-Linked</Label>
        </div>
      </div>

      <MembershipLinkTable
        refreshKey={refreshKey}
        onEdit={(r) => {
          setEditRow(r);
          setFormOpen(true);
        }}
        onView={(r) => {
          setViewId(r.membershipLinkId);
          setViewOpen(true);
        }}
      />

      <MembershipLinkFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditRow(undefined);
          setMembershipData(undefined);
        }}
        membershipData={membershipData}
        onSave={() => setRefreshKey((p) => p + 1)}
      />

      <MembershipLinkViewModal
        isOpen={viewOpen}
        membershipLinkId={viewId}
        onClose={() => setViewOpen(false)}
      />

      <MembershipLinkExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={() => {
          handleSaved();
        }}
      />
    </div>
  );
}
