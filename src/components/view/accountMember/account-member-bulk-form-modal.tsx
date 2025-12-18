import { useEffect, useState, useRef, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { getAccounts } from "@/api/account.api";
import { getMembers } from "@/api/member.api";
import { bulkAccountMember } from "@/api/accountMember.api";

import type { Account } from "@/types/account";
import type { Member } from "@/types/member";
import type { Response } from "@/types/response";
import type { AccountMember } from "@/types/accountMember";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Layers,
} from "lucide-react";
import type { Enums } from "@/types/enums";
import { getEnumsByCategory } from "@/api/enums.api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type MemberSearchParams = {
  name: string;
  address: string;
  contactNumber: string;
  ageGroup: string;
  maratialStatus: string;
  idProofNumber: string;
  includeCasual: boolean;
};

type SelectedMemberConfig = {
  memberData: Member;
  relationship: string;
  linkBilling: boolean;
};

type ViewMode = "search" | "review";

export default function AccountMemberBulkFormModal({ isOpen, onClose }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("search");
  const [accountId, setAccountId] = useState<string>("");
  const [selectedMembers, setSelectedMembers] = useState<
    Record<number, SelectedMemberConfig>
  >({});

  const [bulkRel, setBulkRel] = useState("");

  const [showFilters, setShowFilters] = useState(true);
  const [searchParams, setSearchParams] = useState<MemberSearchParams>({
    name: "",
    address: "",
    contactNumber: "",
    ageGroup: "",
    maratialStatus: "",
    idProofNumber: "",
    includeCasual: false,
  });
  const [relationshipEnums, setRelationshipEnums] = useState<Enums[]>([]);

  const [debouncedParams, setDebouncedParams] =
    useState<MemberSearchParams>(searchParams);

  const [accountOptions, setAccountOptions] = useState<Account[]>([]);
  const [memberOptions, setMemberOptions] = useState<Member[]>([]);

  const [visibleCount, setVisibleCount] = useState(50);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    if (!isOpen) return;
    const loadAccounts = async () => {
      try {
        const accRes: Response<Account[]> = await getAccounts({
          page: 1,
          limit: 1000,
        });
        setAccountOptions(accRes.data as Account[]);
      } catch (error) {
        console.error("Failed to load accounts", error);
      }
    };
    loadAccounts();

    setAccountId("");
    setSelectedMembers({});
    setVisibleCount(50);
    setViewMode("search");
    setBulkRel("");

    const initialParams = {
      name: "",
      address: "",
      contactNumber: "",
      ageGroup: "",
      maratialStatus: "",
      idProofNumber: "",
      includeCasual: false,
    };

    const loadRelationshipEnums = async () => {
      try {
        const res: Response<Enums[]> = await getEnumsByCategory("Relationship");
        setRelationshipEnums(res.data ?? []);
      } catch (e) {
        console.error("Failed to load Relationship enums", e);
      }
    };

    loadRelationshipEnums();

    setSearchParams(initialParams);
    setDebouncedParams(initialParams);
    fetchMembers(initialParams);
  }, [isOpen]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const handler = setTimeout(() => {
      setDebouncedParams(searchParams);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchParams]);

  useEffect(() => {
    if (!isOpen) return;
    setVisibleCount(50);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    fetchMembers(debouncedParams);
  }, [debouncedParams]);

  const fetchMembers = async (params: MemberSearchParams) => {
    setIsLoadingMembers(true);
    try {
      const memRes: Response<Member[]> = await getMembers({
        page: 1,
        limit: 1000,
        memberFirstName: params.name,
        maratialStatus: params.maratialStatus,
        age: params.ageGroup,
        contactNumber: params.contactNumber,
        address: params.address,
        idProofNumber: params.idProofNumber,
        includeCasual: params.includeCasual,
      });
      setMemberOptions(memRes.data as Member[]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      if (visibleCount < memberOptions.length) {
        setVisibleCount((prev) => Math.min(prev + 50, memberOptions.length));
      }
    }
  };

  const handleSearchChange = (
    field: keyof MemberSearchParams,
    value: string | boolean
  ) => {
    setSearchParams((prev) => ({ ...prev, [field]: value }));
  };

  const handleMemberToggle = (member: Member) => {
    setSelectedMembers((prev) => {
      const copy = { ...prev };
      if (copy[member.memberId]) {
        delete copy[member.memberId];
      } else {
        copy[member.memberId] = {
          memberData: member,
          relationship: "",
          linkBilling: false,
        };
      }
      return copy;
    });
  };

  const updateSelectedMember = (
    id: number,
    field: keyof SelectedMemberConfig,
    value: any
  ) => {
    setSelectedMembers((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const applyBulkRelationship = () => {
    if (!bulkRel) return;
    setSelectedMembers((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[Number(key)].relationship = bulkRel;
      });
      return next;
    });
    toast({
      title: "Applied",
      description: `Relationship set to '${bulkRel}' for all users.`,
    });
  };

  const applyBulkBilling = (val: boolean) => {
    setSelectedMembers((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[Number(key)].linkBilling = val;
      });
      return next;
    });
    toast({
      title: "Applied",
      description: `Billing ${val ? "enabled" : "disabled"} for all users.`,
    });
  };

  const selectedCount = Object.keys(selectedMembers).length;
  const selectedList = Object.values(selectedMembers);

  const visibleMembers = useMemo(() => {
    return memberOptions.slice(0, visibleCount);
  }, [memberOptions, visibleCount]);

  const handleSubmit = async () => {
    if (!accountId) {
      toast({
        title: "Validation",
        description: "Please select an Account",
        variant: "destructive",
      });
      return;
    }
    if (selectedCount === 0) {
      toast({
        title: "Validation",
        description: "Please select at least one Member",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const membersPayload = selectedList.map((item) => ({
      memberId: item.memberData.memberId,
      relationship: item.relationship,
      linkBilling: item.linkBilling,
    }));

    const finalPayload = {
      accountId: Number(accountId),
      members: membersPayload,
    };

    try {
      const res: Response<AccountMember> = await bulkAccountMember(
        finalPayload as any
      );
      if (res?.success) {
        toast({
          title: "Success",
          description: "Members Linked Successfully.",
          variant: "success",
        });
        onClose();
      } else {
        toast({
          title: "Error",
          description: "Failed to link Members.",
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Network error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[1200px] p-0 gap-0 bg-background overflow-hidden h-[90vh] flex flex-col rounded-xl border shadow-xl">
        <FormHeader
          title={
            viewMode === "search"
              ? "Step 1: Select Members"
              : "Step 2: Configure & Link"
          }
          onClose={onClose}
        />

        {viewMode === "search" && (
          <div className="flex flex-col h-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b bg-muted/5 space-y-4">
              <div className="max-w-md">
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                  Target Account
                </Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger className="bg-background h-9">
                    <SelectValue placeholder="Select Account to Link" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountOptions.map((acc) => (
                      <SelectItem
                        key={acc.accountId}
                        value={String(acc.accountId)}
                      >
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    className="pl-9 bg-background h-9"
                    value={searchParams.name}
                    onChange={(e) => handleSearchChange("name", e.target.value)}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-fit text-xs h-6 px-0 text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  {showFilters ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  {showFilters ? "Hide Filters" : "Show Advanced Filters"}
                </Button>

                {showFilters && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 p-2 bg-muted/20 rounded-md border border-border/40">
                    <Input
                      placeholder="Address / City"
                      className="h-8 text-xs bg-background"
                      value={searchParams.address}
                      onChange={(e) =>
                        handleSearchChange("address", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Mobile"
                      className="h-8 text-xs bg-background"
                      value={searchParams.contactNumber}
                      onChange={(e) =>
                        handleSearchChange("contactNumber", e.target.value)
                      }
                    />
                    <Input
                      placeholder="ID Proof"
                      className="h-8 text-xs bg-background"
                      value={searchParams.idProofNumber}
                      onChange={(e) =>
                        handleSearchChange("idProofNumber", e.target.value)
                      }
                    />
                    <div className="flex items-center justify-center border rounded-md h-8 bg-background px-2">
                      <Checkbox
                        id="casual"
                        checked={searchParams.includeCasual}
                        onCheckedChange={(c) =>
                          handleSearchChange("includeCasual", c as boolean)
                        }
                      />
                      <Label
                        htmlFor="casual"
                        className="ml-2 text-[10px] cursor-pointer"
                      >
                        Include Casual
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 bg-muted/10"
            >
              {isLoadingMembers && visibleCount === 50 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[...Array(9)].map((_, i) => (
                    <div
                      key={i}
                      className="h-24 bg-muted/20 animate-pulse rounded-lg border"
                    />
                  ))}
                </div>
              ) : memberOptions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                  <Users className="h-12 w-12 mb-2" />
                  <p>No members found matching criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pb-8">
                  {visibleMembers.map((member) => {
                    const isSelected = !!selectedMembers[member.memberId];
                    return (
                      <div
                        key={member.memberId}
                        onClick={() => handleMemberToggle(member)}
                        className={`
                                            relative flex flex-col p-3 rounded-lg border cursor-pointer transition-all duration-200 select-none
                                            ${
                                              isSelected
                                                ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20"
                                                : "bg-background hover:border-primary/50 hover:shadow-sm"
                                            }
                                        `}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-4 w-4 rounded border flex items-center justify-center ${
                                isSelected
                                  ? "bg-primary border-primary"
                                  : "border-muted-foreground"
                              }`}
                            >
                              {isSelected && (
                                <CheckCircle2 className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <span className="font-semibold text-sm truncate max-w-[140px]">
                              {member.memberFirstName} {member.memberLastName}
                            </span>
                          </div>
                          {member.maratialStatus && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 h-5 font-normal"
                            >
                              {member.maratialStatus}
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1 ml-6">
                          <div className="truncate">
                            {member.contactNumber || "No Contact"}
                          </div>
                          <div className="truncate opacity-80">
                            {member.address || member.city || "No Address"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-background flex justify-between items-center z-10 shadow-[0_-5px_10px_rgba(0,0,0,0.03)]">
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-primary">
                  {selectedCount}
                </span>{" "}
                members selected
              </div>
              <Button
                disabled={selectedCount === 0}
                onClick={() => setViewMode("review")}
                className="gap-2"
              >
                Review & Configure <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {viewMode === "review" && (
          <div className="flex flex-col h-full overflow-hidden animate-in slide-in-from-right-10 duration-300">
            <div className="p-4 border-b bg-muted/10 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("search")}
                  className="h-7 px-2 -ml-2 text-muted-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Selection
                </Button>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-sm font-medium">Bulk Configuration</span>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-end md:items-center bg-background p-3 rounded-lg border shadow-sm">
                <div className="flex-1 w-full flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <Select value={bulkRel} onValueChange={setBulkRel}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Set Relationship for ALL..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* {relationshipEnums.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.value}
                        </SelectItem>
                      ))} */}
                      <SelectItem key={"son"} value={"son"}>
                        son
                      </SelectItem>
                      <SelectItem key={"daughter"} value={"daughter"}>
                        daughter
                      </SelectItem>
                      <SelectItem key={"wife"} value={"wife"}>
                        wife
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={applyBulkRelationship}
                    disabled={!bulkRel}
                    className="h-8 whitespace-nowrap"
                  >
                    Apply All
                  </Button>
                </div>

                <Separator
                  orientation="vertical"
                  className="hidden md:block h-6"
                />

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Billing for ALL:
                  </span>
                  <div className="flex border rounded-md overflow-hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => applyBulkBilling(true)}
                      className="h-8 rounded-none hover:bg-green-50 hover:text-green-600 text-xs"
                    >
                      Enable
                    </Button>
                    <Separator orientation="vertical" className="h-8" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => applyBulkBilling(false)}
                      className="h-8 rounded-none hover:bg-red-50 hover:text-red-600 text-xs"
                    >
                      Disable
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 px-6 py-2 bg-muted/5 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-4 md:col-span-3">Member Name</div>
              <div className="col-span-4 md:col-span-3">Contact</div>
              <div className="col-span-4 md:col-span-4">Relationship</div>
              <div className="col-span-12 md:col-span-2 text-right md:text-center mt-1 md:mt-0">
                Billing
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-background">
              {selectedList.map((item, index) => (
                <div
                  key={item.memberData.memberId}
                  className={`
                                grid grid-cols-12 gap-4 px-6 py-3 items-center border-b hover:bg-muted/5 transition-colors
                                ${
                                  index % 2 === 0
                                    ? "bg-white"
                                    : "bg-slate-50/30"
                                }
                            `}
                >
                  <div className="col-span-4 md:col-span-3 font-medium text-sm truncate flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-destructive -ml-2 mr-1"
                      onClick={() => handleMemberToggle(item.memberData)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <span className="truncate">
                      {item.memberData.memberFirstName}{" "}
                      {item.memberData.memberLastName}
                    </span>
                  </div>

                  <div className="col-span-4 md:col-span-3 text-xs text-muted-foreground truncate">
                    {item.memberData.contactNumber || "-"}
                    <span className="block opacity-70 text-[10px]">
                      {item.memberData.maratialStatus}
                    </span>
                  </div>

                  <div className="col-span-4 md:col-span-4">
                    <Select
                      value={item.relationship}
                      onValueChange={(val) =>
                        updateSelectedMember(
                          item.memberData.memberId,
                          "relationship",
                          val
                        )
                      }
                    >
                      <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue placeholder="Relationship..." />
                      </SelectTrigger>
                      <SelectContent>
                        {/* {relationshipEnums.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.value}
                          </SelectItem>
                        ))} */}

                        <SelectItem key={"son"} value={"son"}>
                          son
                        </SelectItem>
                        <SelectItem key={"daughter"} value={"daughter"}>
                          daughter
                        </SelectItem>
                        <SelectItem key={"wife"} value={"wife"}>
                          wife
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-12 md:col-span-2 flex justify-end md:justify-center mt-1 md:mt-0">
                    <div
                      className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer border transition-all select-none
                                        ${
                                          item.linkBilling
                                            ? "bg-green-50 border-green-200 text-green-700"
                                            : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                                        }
                                    `}
                      onClick={() =>
                        updateSelectedMember(
                          item.memberData.memberId,
                          "linkBilling",
                          !item.linkBilling
                        )
                      }
                    >
                      <span className="text-[10px] font-semibold">
                        {item.linkBilling ? "Linked" : "Unlinked"}
                      </span>
                      <Checkbox
                        checked={item.linkBilling}
                        className="h-3.5 w-3.5 pointer-events-none data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {selectedList.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <p>No members selected.</p>
                  <Button variant="link" onClick={() => setViewMode("search")}>
                    Go back to select members
                  </Button>
                </div>
              )}
            </div>

            <FormFooter
              onClose={onClose}
              onSubmit={handleSubmit}
              submitLabel={`Confirm Link (${selectedCount})`}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
