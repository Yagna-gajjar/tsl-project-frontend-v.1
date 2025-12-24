import { useCallback, useEffect, useState } from "react";
import { Plus, Upload } from "lucide-react";

import type { Account } from "@/types/account";
import type { Enums } from "@/types/enums";
import type { Entity } from "@/types/entity";
import type { Response } from "@/types/response";

import AccountTable from "@/components/view/account/account-table";
import AccountFormModal from "@/components/view/account/account-form-modal";
import AccountViewModal from "@/components/view/account/account-view-modal";
import AccountExcelUpload from "@/components/view/account/account-excel-upload";

import { Button } from "@/components/ui/button";
import { SearchableMultiselect } from "@/components/form-modal/form-field-input";

import { getEnumsByCategory } from "@/api/enums.api";
import { getEntities } from "@/api/entity.api";
import { toast } from "@/hooks/use-toast";

export default function AccountPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [excelOpen, setExcelOpen] = useState(false);

  const [editRow, setEditRow] = useState<Account>();
  const [viewId, setViewId] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);

  const [entityClassification, setEntityClassification] = useState<number>(2);
  const [entityType, setEntityType] = useState<Enums[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<string>("all");

  const [selectedEntityId, setSelectedEntityId] = useState<number | "all">(
    "all"
  );

  const [entities, setEntities] = useState<Entity[]>([]);
  const [entitiesPage, setEntitiesPage] = useState(1);
  const [hasMoreEntities, setHasMoreEntities] = useState(true);
  const [loadingEntities, setLoadingEntities] = useState(false);

  const PAGE_SIZE = 20;

  const fetchEntityType = async (enumCase: number) => {
    try {
      const res: Response<Enums[]> = await getEnumsByCategory("ENTITY TYPE", {
        includeEnumCase: String(enumCase),
      });

      setEntityType(res?.data ?? []);
    } catch (err) {
      console.error("Failed to fetch entity type", err);
      setEntityType([]);
    }
  };

  useEffect(() => {
    fetchEntityType(entityClassification);
    setSelectedEntityType("all");
  }, [entityClassification]);

  const fetchEntities = useCallback(
    async (isInitial = false) => {
      if (loadingEntities) return;
      if (!isInitial && !hasMoreEntities) return;

      setLoadingEntities(true);

      try {
        const page = isInitial ? 1 : entitiesPage;

        const res: Response<Entity[]> = await getEntities({
          limit: PAGE_SIZE,
          page,
          entityType:
            selectedEntityType === "all" ? undefined : selectedEntityType,
        });

        const items = res?.data ?? [];

        console.log(res, "1234567890");
        

        setEntities((prev) => (isInitial ? items : [...prev, ...items]));
        setHasMoreEntities(items.length === PAGE_SIZE);
        setEntitiesPage(page + 1);
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
    [loadingEntities, hasMoreEntities, entitiesPage, selectedEntityType]
  );

  useEffect(() => {
    setEntities([]);
    setEntitiesPage(1);
    setHasMoreEntities(true);
    setSelectedEntityId("all");
    fetchEntities(true);
  }, [selectedEntityType]);

  const bumpRefresh = () => setRefreshKey((p) => p + 1);

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Account Management</h1>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setExcelOpen(true)}
            className="flex items-center gap-2 border-emerald-600 text-emerald-600"
          >
            <Upload className="w-5 h-5" />
            Upload Excel
          </Button>

          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Account
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-1/4">
          <SearchableMultiselect
            isSingle
            placeholder="Entity Classification"
            value={entityClassification}
            options={[
              { label: "Family", value: 2 },
              { label: "Client", value: 1 },
              { label: "Partner", value: 4 },
              { label: "Facility", value: 5 },
            ]}
            onChange={(v) => setEntityClassification(Number(v))}
          />
        </div>

        <div className="w-1/4">
          <SearchableMultiselect
            isSingle
            placeholder="Entity Type"
            value={selectedEntityType}
            options={[
              { label: "All", value: "all" },
              ...entityType.map((e) => ({
                label: e.value,
                value: e.value,
              })),
            ]}
            onChange={(v) => setSelectedEntityType(v ?? "all")}
          />
        </div>

        <div className="w-1/4">
          <SearchableMultiselect
            isSingle
            placeholder="Entity Name"
            value={selectedEntityId === "all" ? null : selectedEntityId}
            options={[
              { label: "All", value: "all" },
              ...entities.map((e) => ({
                label: e.entityName,
                value: Number(e.entityId),
              })),
            ]}
            onChange={(v) => setSelectedEntityId(v ?? "all")}
            onLoadMore={() => fetchEntities()}
            isLoadingMore={loadingEntities}
          />
        </div>
      </div>

      <AccountTable
        refreshKey={refreshKey}
        onEdit={(r) => {
          console.log(r, "from table");
          
          setEditRow(r);
          setFormOpen(true);
        }}
        onView={(r) => {
          setViewId(r.accountId);
          setViewOpen(true);
        }}
      />

      <AccountFormModal
        isOpen={formOpen}
        initialData={editRow}
        onClose={() => {
          setFormOpen(false);
          setEditRow(undefined);
        }}
        onSave={bumpRefresh}
      />

      <AccountViewModal
        isOpen={viewOpen}
        accountId={viewId}
        onClose={() => setViewOpen(false)}
      />

      <AccountExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={bumpRefresh}
      />
    </div>
  );
}
