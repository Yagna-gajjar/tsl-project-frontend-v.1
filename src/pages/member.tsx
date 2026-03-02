import { useEffect, useState } from "react";
import { Plus, Upload, Search, Loader2 } from "lucide-react";
import MemberTable from "@/components/view/members/member-table";
import MemberFormModal from "@/components/view/members/member-form-modal";
import MemberViewModal from "@/components/view/members/member-view-modal";
import MemberExcelUpload from "@/components/view/members/member-excel-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchableMultiselect } from "@/components/form-modal/form-field-input";
import { toast } from "@/hooks/use-toast";
import { getEnumsByCategory } from "@/api/enums.api";
import {
  checkDuplicateEmail, checkDuplicateIdProof,
  checkDuplicateContact, checkDuplicateMemberByName
} from "@/api/member.api";
import type { Member } from "@/types/member";
import type { Enums } from "@/types/enums";

export default function MemberPage() {
  const queryParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialFamilyId = queryParams.get("familyId") ? Number(queryParams.get("familyId")) : undefined;

  const [inputs, setInputs] = useState({
    firstName: "", lastName: "", email: "", contactNumber: "", idProofType: "", idProofNumber: ""
  });

  const [activeFilters, setActiveFilters] = useState<any>(null);
  const [isCleared, setIsCleared] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [excelOpen, setExcelOpen] = useState(false);
  const [editRow, setEditRow] = useState<Member | null>(null);
  const [viewData, setViewData] = useState<Member | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [idProofEnums, setIdProofEnums] = useState<Enums[]>([]);

  useEffect(() => {
    getEnumsByCategory("IDPROOFTYPE").then(res => setIdProofEnums(res.data || []));
  }, []);

  const handleInputChange = (key: string, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    setIsCleared(false);
  };

  const handleCopyMember = (row: Member) => {
    const {
      memberId,
      createdAt,
      updatedAt,
      avatar,
      ...memberDataWithoutId
    } = row;

    setEditRow(memberDataWithoutId as Member);
    setFormOpen(true);

    toast({
      title: "Data Copied",
      description: `Ready to add a new member based on ${row.memberFirstName}'s details.`,
    });
  };

  const handleRunProcess = async () => {
    setIsChecking(true);
    setActiveFilters({
      memberFirstName: inputs.firstName,
      memberLastName: inputs.lastName,
      email: inputs.email,
      contactNumber: inputs.contactNumber,
      idProofType: inputs.idProofType,
      idProofNumber: inputs.idProofNumber
    });

    try {
      const { firstName, lastName, email, contactNumber, idProofType, idProofNumber } = inputs;
      const checks = [];
      if (firstName || lastName) checks.push(checkDuplicateMemberByName(firstName, lastName).then(res => ({ type: 'Member', data: res.data })));
      if (email) checks.push(checkDuplicateEmail(email).then(res => ({ type: 'Email', data: res.data })));
      if (contactNumber) checks.push(checkDuplicateContact(contactNumber).then(res => ({ type: 'Contact', data: res.data })));
      if (idProofType && idProofNumber) checks.push(checkDuplicateIdProof(idProofType, idProofNumber).then(res => ({ type: 'ID Proof', data: res.data })));

      const results = await Promise.all(checks);
      const duplicates = results.filter((r: any) => r.data && r.data?.length > 0);

      if (duplicates.length > 0) {
        setIsCleared(false);
        const msgs = duplicates.map((d: any) => `${d.type}: ${d.data?.length} found`).join(", ");
        toast({ title: "Duplicates Found", description: msgs, variant: "destructive" });
      } else {
        setIsCleared(true);
        toast({ title: "No Duplicates", description: "Search results updated. You may now add a member." });
      }
    } catch (error) {
      setIsCleared(false);
      toast({ title: "Error", description: "Duplicate check failed", variant: "destructive" });
    } finally {
      setIsChecking(false);
    }
  };

  const handleAddMemberAfterCheck = () => {
    setEditRow({
      memberFirstName: inputs.firstName,
      memberLastName: inputs.lastName,
      email: inputs.email,
      contactNumber: inputs.contactNumber,
      idProofType: inputs.idProofType,
      idProofNumber: inputs.idProofNumber
    } as Member);
    setFormOpen(true);
  };

  return (
    <div className="mx-auto px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground">Manage and filter organization members.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setExcelOpen(true)} className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
            <Upload className="w-4 h-4 mr-2" /> Upload Excel
          </Button>
          {isCleared && (
            <Button onClick={handleAddMemberAfterCheck} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Add This Member
            </Button>
          )}
        </div>
      </div>

      <div className={`p-4 bg-muted/40 rounded-xl border-2 transition-all ${isCleared ? 'border-emerald-500/50 bg-emerald-50/10' : 'border-dashed border-muted'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Search & Validation</span>
            {isCleared && <Badge className="bg-emerald-500">Validated</Badge>}
          </div>
          <Button
            variant="default"
            className="px-6 bg-indigo-600 hover:bg-indigo-700"
            onClick={handleRunProcess}
            disabled={isChecking}
          >
            {isChecking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
            {isCleared ? "Re-Run Check" : "Run Duplicate Check"}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <InputGroup label="First Name" value={inputs.firstName} onChange={(v: string) => handleInputChange("firstName", v)} />
          <InputGroup label="Last Name" value={inputs.lastName} onChange={(v: string) => handleInputChange("lastName", v)} />
          <InputGroup label="Contact" value={inputs.contactNumber} onChange={(v: string) => handleInputChange("contactNumber", v)} />
          <InputGroup label="Email" value={inputs.email} onChange={(v: string) => handleInputChange("email", v)} />
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">ID Type</label>
            <SearchableMultiselect isSingle value={inputs.idProofType} options={idProofEnums.map(e => ({ label: e.value, value: e.value }))} onChange={v => handleInputChange("idProofType", v ?? "")} />
          </div>
          <InputGroup label="ID Number" value={inputs.idProofNumber} onChange={(v: string) => handleInputChange("idProofNumber", v)} />
        </div>
      </div>

      <MemberTable
        onOpenForm={(row) => {
          setEditRow(row ?? null);
          setFormOpen(true);
        }}
        onOpenView={(row) => {
          setViewData(row);
          setViewOpen(true);
        }}
        onCopy={handleCopyMember}
        refreshKey={refreshKey}
        initialFamilyId={initialFamilyId}
        filters={activeFilters}
      />

      <MemberFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditRow(null);
        }}
        initialData={editRow as any || null}
        onSaved={() => {
          setRefreshKey(k => k + 1);
          setIsCleared(false);
        }}
      />
      <MemberViewModal isOpen={viewOpen} onClose={() => setViewOpen(false)} item={viewData} />
      <MemberExcelUpload isOpen={excelOpen} onClose={() => setExcelOpen(false)} onSuccess={() => setRefreshKey(k => k + 1)} />
    </div>
  );
}

function InputGroup({ label, value, onChange }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase text-muted-foreground">{label}</label>
      <Input placeholder={label} value={value} onChange={e => onChange(e.target.value)} className="bg-background" />
    </div>
  );
}