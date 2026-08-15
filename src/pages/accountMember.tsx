import { useEffect, useState, useMemo } from "react";
import AccountMemberTable from "@/components/view/accountMember/account-member-table";
import AccountMemberFormModal from "@/components/view/accountMember/account-member-form-modal";
import AccountMemberViewModal from "@/components/view/accountMember/account-member-view-modal";
import AccountMemberBulkFormModal from "@/components/view/accountMember/account-member-bulk-form-modal";
import type { AccountMember } from "@/types/accountMember";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import AccountMemberExcelUpload from "@/components/view/accountMember/account-member-excel-upload";
import { SearchableMultiselect } from "@/components/form-modal/form-field-input";
import { getEnumsByCategory } from "@/api/enums.api";
import type { Enums } from "@/types/enums";
import type { Response } from "@/types/response";
import { getEntities } from "@/api/entity.api";
import { getAccounts } from "@/api/account.api";
import type { Account } from "@/types/account";
import { toast } from "@/hooks/use-toast";

export default function AccountMemberPage() {
  const [openForm, setOpenForm] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openBulkForm, setOpenBulkForm] = useState(false);
  const [excelOpen, setExcelOpen] = useState(false);

  const [entityTypeEnums, setEntityTypeEnums] = useState<Enums[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [selected, setSelected] = useState<AccountMember | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [classification, setClassification] = useState<string>("all");
  const [selectedEnumId, setSelectedEnumId] = useState<string>("all");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("all");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");

  const bumpRefresh = () => setRefreshKey((s) => s + 1);

  const filteredEnums = useMemo(() => {
    if (classification === "all") return entityTypeEnums;
    const caseMap: Record<string, number> = { family: 2, client: 1, partner: 4, facility: 5, tsl:6 };
    const targetCase = caseMap[classification];
    return entityTypeEnums.filter((e) => e.enumCase === targetCase);
  }, [classification, entityTypeEnums]);

  useEffect(() => {
    const fetchEntityTypes = async () => {
      const res: Response<Enums[]> = await getEnumsByCategory("ENTITYTYPE");
      setEntityTypeEnums(res.data || []);
    };
    fetchEntityTypes();
  }, []);

  useEffect(() => {
    const fetchEntitiesData = async () => {
      try {
        const res = await getEntities({
          entityType: selectedEnumId.toLowerCase() === 'all' ? undefined : selectedEnumId,
          limit: 10000
        });
        if (res.success) setEntities(res.data || []);
      } catch (error) {
        toast({ title: "Error", description: "Failed to fetch Entities", variant: "destructive" });
      }
    };
    fetchEntitiesData();
  }, [selectedEnumId]);

  useEffect(() => {
    const fetchAccountsData = async () => {
      if (selectedEntityId === "all") {
        setAccounts([]);
        setSelectedAccountId("all");
        return;
      }
      // Account type spellings are inconsistent in existing data (e.g. "Others"
      // vs "Other", "Transactions" vs "Transaction"), so no type filter is
      // applied here — every account tied to the selected entity is shown.
      try {
        const res: Response<Account[]> = await getAccounts({
          limit: 10000,
          entityId: Number(selectedEntityId),
          entityType: selectedEnumId.toLowerCase() !== 'all' ? selectedEnumId : undefined,
        });
        if (res.success) setAccounts(res.data || []);
      } catch (error) {
        toast({ title: "Error", description: "Failed to fetch accounts", variant: "destructive" });
        setAccounts([]);
      }
    };
    fetchAccountsData();
  }, [selectedEntityId, selectedEnumId]);

  const handleSaved = () => bumpRefresh();

  const selectedEntity = entities.find(
    (ent) => String(ent.entityId || ent.id) === selectedEntityId
  );
  const selectedAccount = accounts.find(
    (acc) => String(acc.accountId) === selectedAccountId
  );

  const classificationOptions = [
    { label: "All", value: "all" },
    { label: "Family", value: "family" },
    { label: "Client", value: "client" },
    { label: "Partner", value: "partner" },
    { label: "Facility", value: "facility" },
    { label: "TSL", value: "tsl" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Account Members</h1>
        <div className="gap-3 flex">
          <Button variant="outline" size="lg" onClick={() => setExcelOpen(true)} className="border-emerald-600 text-emerald-600">
            <Upload className="w-5 h-5 mr-2" /> Upload Excel
          </Button>
          {selectedAccountId != 'all' &&
            <>
              <Button onClick={() => setOpenBulkForm(true)}>Bulk Link Member</Button>
              <Button onClick={() => { setSelected(null); setOpenForm(true); }}>Link Member</Button>
            </>
          }
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
        <SearchableMultiselect
          isSingle
          placeholder="Classification"
          value={classification === "all" ? null : classification}
          options={classificationOptions}
          onChange={(v) => {
            setClassification(v ?? "all");
            setSelectedEnumId("all");
            setSelectedEntityId("all");
            setSelectedAccountId("all");
            bumpRefresh();
          }}
        />

        <SearchableMultiselect
          isSingle
          placeholder="Entity Type"
          value={selectedEnumId === "all" ? null : selectedEnumId}
          options={[{ label: "All Types", value: "all" }, ...filteredEnums.map((e) => ({ label: e.value, value: e.value }))]}
          onChange={(v) => {
            setSelectedEnumId(v ?? "all");
            setSelectedEntityId("all");
            setSelectedAccountId("all");
            bumpRefresh();
          }}
        />

        <SearchableMultiselect
          isSingle
          placeholder="Entity"
          value={selectedEntityId === "all" ? null : selectedEntityId}
          options={[{ label: "All Entities", value: "all" }, ...entities.map((ent) => ({ label: ent.entityName || ent.name, value: String(ent.entityId || ent.id) }))]}
          onChange={(v) => {
            setSelectedEntityId(v ?? "all");
            setSelectedAccountId("all");
            bumpRefresh();
          }}
        />

        <SearchableMultiselect
          isSingle
          placeholder="Select Account"
          value={selectedAccountId === "all" ? null : selectedAccountId}
          options={[
            { label: "All Accounts", value: "all" },
            ...accounts.map((acc) => ({
              label: `${acc.accountName} (${acc.activeMembers})`,
              value: String(acc.accountId),
            })),
          ]}
          onChange={(v) => {
            setSelectedAccountId(v ?? "all");
            bumpRefresh();
          }}
        />
      </div>

      <AccountMemberTable
        key={`${refreshKey}-${classification}-${selectedEnumId}-${selectedEntityId}-${selectedAccountId}`}
        onEdit={(row) => { setSelected(row); setOpenForm(true); }}
        onView={(row) => { setSelected(row); setOpenView(true); }}
        accountId={selectedAccountId !== "all" ? Number(selectedAccountId) : undefined}
      />

      <AccountMemberFormModal
        isOpen={openForm}
        initialData={selected ?? undefined}
        onClose={() => setOpenForm(false)}
        onSaved={handleSaved}
        accountId={selectedAccountId !== "all" ? Number(selectedAccountId) : undefined}
        accountName={selectedAccount?.accountName}
        entityType={selectedEnumId !== "all" ? selectedEnumId : undefined}
        entityName={selectedEntity?.entityName || selectedEntity?.name}
      />

      <AccountMemberViewModal
        isOpen={openView}
        accountMemberId={selected?.accountMemberId}
        onClose={() => setOpenView(false)}
      />

      <AccountMemberBulkFormModal
        isOpen={openBulkForm}
        onClose={() => setOpenBulkForm(false)}
        accountId={selectedAccountId !== "all" ? Number(selectedAccountId) : undefined}
        entityType={selectedEnumId !== "all" ? selectedEnumId : undefined}
        onSaved={handleSaved}
      />


      <AccountMemberExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={handleSaved}
      />
    </div>
  );
}