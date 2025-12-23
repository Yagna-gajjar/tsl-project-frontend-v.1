import { useEffect, useState } from "react";
import MembershipTable from "@/components/view/membership/membership-table";
import MembershipFormModal from "@/components/view/membership/membership-form-modal";
import MembershipViewModal from "@/components/view/membership/membership-view-modal";
import type { membership } from "@/types/membership";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import MembershipInstanceExcelUpload from "@/components/view/membership/membership-excel-upload";
import type { MembershipMaster } from "@/types/membershipMaster";
import type { Enums } from "@/types/enums";
import type { Entity } from "@/types/entity";
import type { Response } from "@/types/response";
import { getEnumsByCategory } from "@/api/enums.api";
import { getMembershipMasters } from "@/api/membershipMaster.api";
import { toast } from "@/hooks/use-toast";
import { getEntities, getEntityByFilter } from "@/api/entity.api";
import { SearchableMultiselect } from "@/components/form-modal/form-field-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function MembershipPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [entityTypeEnums, setEntityTypeEnums] = useState<Enums[]>([]);
  const [entityType, setEntityType] = useState<string>("all");
  const [excelOpen, setExcelOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<membership | null>(null);
  const [membershipMasterId, setMembershipMasterId] = useState<string>("all");
  const [selectedMembershipMasterId, setselectedMembershipMasterId] = useState<number>();
  const [entityId, setEntityId] = useState<string>("all");
  const [selectedEntityId, setselectedEntityId] = useState<number>();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [hideExpire, setHideExpire] = useState(false);
  const [membershipMasters, setMembershipMasters] = useState<
    MembershipMaster[]
  >([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const bumpRefresh = () => setRefreshKey((s) => s + 1);

  const openView = (row: membership) => {
    setViewId(row.membershipId ?? null);
    setViewOpen(true);
  };

  const handleSaved = () => {
    bumpRefresh();
  };


  const openForm = (row?: membership | null) => {
    setEditRow(row ?? null);
    setFormOpen(true);
  };

  useEffect(() => {
    const fetchEntityTypes = async () => {
      const res: Response<Enums[]> = await getEnumsByCategory("ENTITY TYPE", {
        enumCase: "3,5,6",
      });
      setEntityTypeEnums(res.data || []);
    };

    fetchEntityTypes();
  }, []);

  useEffect(() => {
    const fetchMembershipMaster = async () => {
      try {
        const res = await getMembershipMasters({
          entityType: entityType.toLowerCase() == 'all' ? undefined : entityType,
          limit: 10000
        });
        if (res.success) {
          const data = res?.data || [];
          setMembershipMasters(data);
        }
        else {
          throw new Error("Failed to fetch MembershipMasters");
        }
      }
      catch {
        toast({
          title: "Error",
          description: "Failed to fetch MembershipMasters",
          variant: "destructive"
        })
      }
    }
    fetchMembershipMaster();
  }, [entityType]);

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        let res;
        if (entityType.toLowerCase() == 'all' || entityType == undefined) {
          res = await getEntities({
            entityType: entityType.toLowerCase() == 'all' ? undefined : entityType,
            limit: 10000
          });
        }
        else {
          res = await getEntityByFilter(entityType);
        }
        if (res.success) {
          const data = res?.data || [];
          setEntities(data);
        }
        else {
          throw new Error("Failed to fetch MembershipMasters");
        }
      }
      catch {
        toast({
          title: "Error",
          description: "Failed to fetch Entities",
          variant: "destructive"
        })
      }
    }
    fetchEntities();
  }, [entityType]);

  return (
    <div className="container mx-auto px-4 space-y-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Memberships</h1>
          <p className="text-muted-foreground">
            Create, edit and view memberships.
          </p>
        </div>
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

          <Button
            size="lg"
            onClick={() => openForm()}
            className="flex items-center gap-2 px-4 py-2"
          >
            <Plus className="w-5 h-5" />
            Add Membership
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

              setselectedMembershipMasterId(selected?.membershipMasterId)
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
                label: e?.entityName,
                value: Number(e?.entityId),
              })),
            ]}
            onChange={(v) => {
              setEntityId(v ?? "all");

              const selected = entities.find((e) => e.entityId === Number(v));

              setselectedEntityId(selected?.entityId);
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={hideExpire}
            onCheckedChange={(v) => setHideExpire(!!v)}
          />
          <Label>Hide Expires</Label>
        </div>
      </div>

      <MembershipTable
        onView={openView}
        onEdit={openForm}
        refreshKey={refreshKey}
        entityType={entityType}
        expire={hideExpire}
        membershipMaster={membershipMasterId}
        entityId={selectedEntityId}
      />

      <MembershipViewModal
        isOpen={viewOpen}
        membershipId={viewId ?? undefined}
        onClose={() => {
          setViewOpen(false);
          setViewId(null);
        }}
      />

      <MembershipFormModal
        isOpen={formOpen}
        initialData={editRow ?? undefined}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          bumpRefresh();
        }}
        entityId={selectedEntityId}
        entityType={entityType}
        membershipMasterId={selectedMembershipMasterId}
      />

      <MembershipInstanceExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={() => {
          handleSaved();
        }}
      />
    </div>
  );
}
