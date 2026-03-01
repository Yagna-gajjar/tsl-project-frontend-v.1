import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Loader2, Search, X, ChevronDown, ChevronUp, Users, CheckCircle2, Layers, Unlink, History } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { getAccounts } from "@/api/account.api";
import { getMembers } from "@/api/member.api";
import { bulkAccountMember, isMemberAlreadyLinked, updateAccountMember, getAccountMembers } from "@/api/accountMember.api";

import type { Account } from "@/types/account";
import type { Member } from "@/types/member";
import type { Response } from "@/types/response";
import type { AccountMember } from "@/types/accountMember";
import type { Enums } from "@/types/enums";
import { getEnumsByCategory } from "@/api/enums.api";
import { toast } from "@/hooks/use-toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  accountId?: number;
  onSaved?: () => void;
  entityType?: string;
};

type MemberSearchParams = {
  name: string;
  contactNumber: string;
  idProofNumber: string;
  includeCasual: boolean;
};

type SelectedMemberConfig = {
  memberData: Member;
  relationship: string;
  linkBilling: boolean;
};

export default function AccountMemberBulkFormModal({ isOpen, onClose, accountId, onSaved, entityType }: Props) {
  const [existingMembers, setExistingMembers] = useState<AccountMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Record<number, SelectedMemberConfig>>({});
  const [relationshipEnums, setRelationshipEnums] = useState<Enums[]>([]);
  const [accountOptions, setAccountOptions] = useState<Account[]>([]);
  const [memberOptions, setMemberOptions] = useState<Member[]>([]);

  const [bulkRel, setBulkRel] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unlinkingIds, setUnlinkingIds] = useState<Set<number>>(new Set());

  const [searchParams, setSearchParams] = useState<MemberSearchParams>({
    name: "", contactNumber: "", idProofNumber: "", includeCasual: false,
  });

  // Count active members (only those without a dlinkDate)
  const activeCount = useMemo(() =>
    existingMembers.filter(m => !m.dlinkDate).length,
    [existingMembers]);

  const fetchExistingLinkedMembers = async () => {
    if (!accountId) return;
    try {
      const res: Response<AccountMember[]> = await getAccountMembers({ accountId, limit: 1000 });
      setExistingMembers(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMembers = async (params: MemberSearchParams) => {
    setSearchLoading(true);
    try {
      const memRes = await getMembers({
        page: 1, limit: 50, memberFirstName: params.name,
        contactNumber: params.contactNumber, idProofNumber: params.idProofNumber,
        includeCasual: params.includeCasual,
      });
      setMemberOptions(memRes.data as Member[]);
    } catch (error) {
      console.error(error);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const init = async () => {
      setInitLoading(true);
      try {
        const [relRes, accRes] = await Promise.all([
          getEnumsByCategory("RELATION"),
          getAccounts({ limit: 1000 }),
        ]);

        const relations = relRes.data ?? [];

        const filteredRelations =
          entityType === "Family"
            ? relations.filter((r) => r.enumCase === 1)
            : relations.filter((r) => r.enumCase === 2);

        setRelationshipEnums(filteredRelations);
        setAccountOptions(accRes.data ?? []);

        await fetchExistingLinkedMembers();
        await fetchMembers(searchParams);
      } finally {
        setInitLoading(false);
      }
    };

    init();
    setSelectedMembers({});
  }, [isOpen, accountId, entityType]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = setTimeout(() => fetchMembers(searchParams), 400);
    return () => clearTimeout(handler);
  }, [searchParams]);

  const handleMemberToggle = async (member: Member) => {
    if (entityType == "Family") {
      try {
        const res: Response<any> = await isMemberAlreadyLinked(Number(member?.memberId));
        if (res.success) {
          if ((res as any)?.isLinked) {
            toast({
              title: "Error",
              description: "Member is already Linked with another family account",
              variant: "destructive"
            })
            return;
          }
        }
        else {
          throw new Error("Failed to fetch");
        }
      }
      catch {
        toast({
          title: "Error",
          description: "Failed to fetch memebrs status.",
          variant: "destructive"
        })
      }
    }

    setSelectedMembers((prev) => {
      const copy = { ...prev };
      if (copy[Number(member.memberId)]) delete copy[Number(member?.memberId)];
      else copy[Number(member.memberId)] = { memberData: member, relationship: "", linkBilling: false };
      return copy;
    });
  };

  const handleDlink = async (am: AccountMember) => {
    setUnlinkingIds(prev => new Set(prev).add(Number(am.accountMemberId)));
    try {
      const res = await updateAccountMember(Number(am.accountMemberId), {
        ...am,
        dlinkDate: format(new Date(), "yyyy-MM-dd"),
        status: "unlinked",
      });
      if (res.success) {
        toast({ title: "Unlinked", description: "Member unlinked successfully", variant: "success" });
        await fetchExistingLinkedMembers();
        onSaved?.();
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to unlink", variant: "destructive" });
    } finally {
      setUnlinkingIds(prev => {
        const next = new Set(prev);
        next.delete(Number(am.accountMemberId));
        return next;
      });
    }
  };

  const handleSubmit = async () => {
    if (!accountId || Object.keys(selectedMembers).length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await bulkAccountMember({
        accountId: Number(accountId),
        members: Object.values(selectedMembers).map(m => ({
          memberId: m.memberData.memberId,
          relationship: m.relationship,
          linkBilling: m.linkBilling
        }))
      } as any);
      if (res.success) {
        toast({ title: "Success", description: "Members linked successfully", variant: "success" });
        onSaved?.();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[1400px] w-[95vw] p-0 bg-background h-[90vh] flex flex-col overflow-hidden">
        <FormHeader
          title={`Manage Account Members: ${accountOptions.find(a => a.accountId === accountId)?.accountName || accountId}`}
          onClose={onClose}
        />

        <div className="flex flex-1 overflow-hidden">
          <div className="w-full md:w-1/2 border-r flex flex-col bg-muted/5">
            <div className="p-4 border-b space-y-3 bg-background">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members to add..."
                  className="h-9"
                  value={searchParams.name}
                  onChange={(e) => setSearchParams(p => ({ ...p, name: e.target.value }))}
                />
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1">
                  <Input
                    placeholder="Mobile"
                    className="h-8 text-xs"
                    onChange={(e) => setSearchParams(p => ({ ...p, contactNumber: e.target.value }))}
                  />
                  <Input
                    placeholder="ID Proof"
                    className="h-8 text-xs"
                    onChange={(e) => setSearchParams(p => ({ ...p, idProofNumber: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 p-4">
              {searchLoading || initLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {memberOptions.map((member) => {
                    const isSelected = !!selectedMembers[Number(member?.memberId)];
                    const isCurrentlyActive = existingMembers.some(am => am.memberId === member.memberId && !am.dlinkDate);

                    return (
                      <div
                        key={member.memberId}
                        onClick={() => !isCurrentlyActive && handleMemberToggle(member)}
                        className={`p-3 rounded-lg border transition-all select-none flex flex-col gap-1 ${isCurrentlyActive ? "opacity-50 cursor-not-allowed bg-muted" : "cursor-pointer hover:border-primary"
                          } ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-background"}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm truncate">{member.memberFirstName} {member.memberLastName}</span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          {isCurrentlyActive && <Badge variant="secondary" className="text-[9px]">Active</Badge>}
                        </div>
                        <span className="text-[11px] text-muted-foreground">{member.contactNumber || 'No contact'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel: Configuration & Linked List */}
          <div className="w-full md:w-1/2 flex flex-col bg-background">
            <div className="p-4 border-b bg-muted/10">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                <Users className="h-4 w-4" /> Final Configuration
              </h3>

              <div className="flex items-center gap-2 bg-background p-2 rounded border border-dashed">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <Select value={bulkRel} onValueChange={setBulkRel}>
                  <SelectTrigger className="h-7 text-[11px] w-[180px]">
                    <SelectValue placeholder="Bulk Relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipEnums.map(r => <SelectItem key={r.value} value={r.value}>{r.value}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px]"
                  disabled={!bulkRel || Object.keys(selectedMembers).length === 0}
                  onClick={() => {
                    const next = { ...selectedMembers };
                    Object.keys(next).forEach(k => next[Number(k)].relationship = bulkRel);
                    setSelectedMembers(next);
                  }}
                >
                  Apply All
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {/* New Selection List */}
                {Object.keys(selectedMembers).length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-xs uppercase text-primary font-bold">New Links to Add</Label>
                    {Object.values(selectedMembers).map((item) => (
                      <div key={item.memberData.memberId} className="p-3 border rounded-lg bg-primary/5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{item.memberData.memberFirstName} {item.memberData.memberLastName}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMemberToggle(item.memberData)}><X className="h-4 w-4" /></Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Select
                            value={item.relationship}
                            onValueChange={(v) => setSelectedMembers(prev => ({
                              ...prev, [Number(item.memberData.memberId)]: { ...prev[Number(item.memberData.memberId)], relationship: v }
                            }))}
                          >
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Rel." /></SelectTrigger>
                            <SelectContent>{relationshipEnums.map(r => <SelectItem key={r.value} value={r.value}>{r.value}</SelectItem>)}</SelectContent>
                          </Select>
                          <div className="flex items-center gap-2 border rounded px-2 h-8 bg-background">
                            <Checkbox
                              checked={item.linkBilling}
                              onCheckedChange={(v) => setSelectedMembers(prev => ({
                                ...prev, [Number(item.memberData.memberId)]: { ...prev[Number(item.memberData.memberId)], linkBilling: !!v }
                              }))}
                            />
                            <span className="text-[10px]">Billing</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <Label className="text-xs uppercase text-muted-foreground font-bold">Linked Members (Active: {activeCount})</Label>
                  {initLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                    </div>
                  ) : existingMembers.map((am) => (
                    <div
                      key={am.accountMemberId}
                      className={`flex items-center justify-between p-3 border rounded-lg ${am.dlinkDate ? 'bg-muted/30 border-dashed opacity-70' : 'hover:bg-muted/30'}`}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{am.memberFirstName} {am.memberLastName}</span>
                          {am.dlinkDate && (
                            <Badge variant="outline" className="text-[8px] h-4 gap-1 text-muted-foreground border-muted-foreground/30">
                              <History className="h-2 w-2" /> Unlinked {format(new Date(am.dlinkDate), "dd MMM")}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{am.relationship} • {am.linkBilling ? 'Billing' : 'No Billing'}</span>
                      </div>

                      {!am.dlinkDate && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={unlinkingIds.has(Number(am.accountMemberId))}
                          className="h-8 text-destructive border-destructive/20 hover:bg-destructive/10 gap-2"
                          onClick={() => handleDlink(am)}
                        >
                          {unlinkingIds.has(Number(am.accountMemberId)) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unlink className="h-3 w-3" />}
                          D-Link
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        <FormFooter
          onClose={onClose}
          onSubmit={handleSubmit}
          submitLabel={`Confirm Link (${Object.keys(selectedMembers).length})`}
          isSubmitting={isSubmitting}
          disabled={Object.keys(selectedMembers).length === 0}
        />
      </DialogContent>
    </Dialog>
  );
}