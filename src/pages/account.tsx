import { useCallback, useEffect, useState, useRef } from "react";
import { Plus, Upload } from "lucide-react";

import type { Account } from "@/types/account";
import type { Enums } from "@/types/enums";
import type { Entity } from "@/types/entity";
import type { Response } from "@/types/response";
import type { AccountMember } from "@/types/accountMember";

import AccountTable from "@/components/view/account/account-table";
import AccountFormModal from "@/components/view/account/account-form-modal";
import AccountViewModal from "@/components/view/account/account-view-modal";
import AccountExcelUpload from "@/components/view/account/account-excel-upload";

import { Button } from "@/components/ui/button";
import { SearchableMultiselect } from "@/components/form-modal/form-field-input";

import { getEnumsByCategory } from "@/api/enums.api";
import { getEntities } from "@/api/entity.api";
import { getAccountMembers } from "@/api/accountMember.api";
import { toast } from "@/hooks/use-toast";

export default function AccountPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [excelOpen, setExcelOpen] = useState(false);

  const [editRow, setEditRow] = useState<Account>();
  const [viewId, setViewId] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);

  const [entityClassification, setEntityClassification] = useState<number>(2);
  const [entityTypeEnums, setEntityTypeEnums] = useState<Enums[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<string>("all");

  const [selectedEntityId, setSelectedEntityId] = useState<number | "all">("all");
  const [selectedMemberId, setSelectedMemberId] = useState<number | "all">("all");

  const [entities, setEntities] = useState<Entity[]>([]);
  const [entitiesPage, setEntitiesPage] = useState(1);
  const [hasMoreEntities, setHasMoreEntities] = useState(true);
  const [loadingEntities, setLoadingEntities] = useState(false);

  const [members, setMembers] = useState<AccountMember[]>([]);
  const [membersPage, setMembersPage] = useState(1);
  const [hasMoreMembers, setHasMoreMembers] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [entitySearch, setEntitySearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  const PAGE_SIZE = 20;
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchEntityTypes = async (enumCase: number) => {
    try {
      const res: Response<Enums[]> = await getEnumsByCategory("ENTITYTYPE", {
        includeEnumCase: String(enumCase),
      });
      setEntityTypeEnums(res?.data ?? []);
    } catch {
      setEntityTypeEnums([]);
    }
  };

  const fetchEntities = useCallback(
    async (isInitial = false, searchStr = entitySearch) => {
      if (loadingEntities || (!isInitial && !hasMoreEntities)) return;

      setLoadingEntities(true);
      try {
        const page = isInitial ? 1 : entitiesPage;
        const res: Response<Entity[]> = await getEntities({
          limit: PAGE_SIZE,
          page,
          search: searchStr || undefined,
          entityType: selectedEntityType === "all" ? undefined : selectedEntityType,
        });

        const data = res?.data ?? [];
        setEntities((p) => (isInitial ? data : [...p, ...data]));
        setHasMoreEntities(data.length === PAGE_SIZE);
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
    [loadingEntities, hasMoreEntities, entitiesPage, selectedEntityType, entitySearch]
  );

  const fetchMembers = useCallback(
    async (isInitial = false, searchStr = memberSearch) => {
      if (loadingMembers || (!isInitial && !hasMoreMembers)) return;

      setLoadingMembers(true);
      try {
        const page = isInitial ? 1 : membersPage;
        const res: Response<AccountMember[]> = await getAccountMembers({
          limit: PAGE_SIZE,
          page,
          search: searchStr || undefined,
          entityType: selectedEntityType,
        });

        const data = res?.data ?? [];
        setMembers((p) => (isInitial ? data : [...p, ...data]));
        setHasMoreMembers(data.length === PAGE_SIZE);
        setMembersPage(page + 1);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch members",
          variant: "destructive",
        });
      } finally {
        setLoadingMembers(false);
      }
    },
    [loadingMembers, hasMoreMembers, membersPage, selectedEntityType, memberSearch]
  );

  // Effect: Entity Classification changes
  useEffect(() => {
    fetchEntityTypes(entityClassification);
    setSelectedEntityType("all");
  }, [entityClassification]);

  // Effect: Reset and Initial Load when Type changes
  useEffect(() => {
    setSelectedEntityId("all");
    setSelectedMemberId("all");
    setEntitySearch("");
    setMemberSearch("");

    setEntities([]);
    setEntitiesPage(1);
    setHasMoreEntities(true);

    setMembers([]);
    setMembersPage(1);
    setHasMoreMembers(true);

    if (selectedEntityType.toLowerCase() === "family") {
      fetchMembers(true, "");
    } else {
      fetchEntities(true, "");
    }
  }, [selectedEntityType]);

  // Handle Search Input with Debounce
  const handleEntitySearch = (val: string) => {
    setEntitySearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      setEntitiesPage(1);
      setHasMoreEntities(true);
      fetchEntities(true, val);
    }, 500);
  };

  const handleMemberSearch = (val: string) => {
    setMemberSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      setMembersPage(1);
      setHasMoreMembers(true);
      fetchMembers(true, val);
    }, 500);
  };

  const bumpRefresh = () => setRefreshKey((p) => p + 1);

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Account Management</h1>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setExcelOpen(true)}
            className="border-emerald-600 text-emerald-600"
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload Excel
          </Button>

          <Button
            onClick={() => {
              setEditRow(undefined);
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      <div className="mb-4 flex gap-3">
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

        <SearchableMultiselect
          isSingle
          placeholder="Entity Type"
          value={selectedEntityType}
          options={[
            { label: "All", value: "all" },
            ...entityTypeEnums.map((e) => ({
              label: e.value,
              value: e.value,
            })),
          ]}
          onChange={(v) => setSelectedEntityType(v ?? "all")}
        />

        {selectedEntityType.toLowerCase() === "family" ? (
          <SearchableMultiselect
            isSingle
            placeholder="Member Name"
            options={members.map((m) => ({
              label: `${m.memberFirstName} ${m.memberLastName}`,
              value: Number(m.memberId),
            }))}
            value={selectedMemberId === "all" ? null : selectedMemberId}
            onChange={(v) => setSelectedMemberId(v ?? "all")}
            onLoadMore={() => fetchMembers()}
            isLoadingMore={loadingMembers}
            onSearch={handleMemberSearch}
          />
        ) : (
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
            onSearch={handleEntitySearch}
          />
        )}
      </div>

      <AccountTable
        refreshKey={refreshKey}
        onEdit={(r) => {
          setEditRow(r);
          setFormOpen(true);
        }}
        onView={(r) => {
          setViewId(Number(r.accountId));
          setViewOpen(true);
        }}
        entityType={selectedEntityType}
        entityId={selectedEntityId !== 'all' ? Number(selectedEntityId) : undefined}
      />

      {formOpen && (
        <AccountFormModal
          isOpen={formOpen}
          initialData={editRow}
          onClose={() => setFormOpen(false)}
          onSave={bumpRefresh}
        />
      )}

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