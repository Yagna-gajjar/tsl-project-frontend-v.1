import { useCallback, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { toast } from "@/hooks/use-toast";
import { Link2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import AccountSearchPanel from "@/components/view/membershipLink/AccountSearchPanel";
import SelectedAccountsPanel from "@/components/view/membershipLink/SelectedAccountsPanel";
import MembershipSearchPanel from "@/components/view/membershipLink/membership-search-panel";
import SelectedMembershipsPanel from "@/components/view/membershipLink/selected-membership-panel";
import { createMembershipLink } from "@/api/membershipLink.api";
import { getAccounts } from "@/api/account.api";
import { getMembershipMasters } from "@/api/membershipMaster.api";
import type { MembershipLink } from "@/types/membershipLink";
import type { Response } from "@/types/response";
import type { Account } from "@/types/account";
import type { MembershipMaster } from "@/types/membershipMaster";
import type { membership } from "@/types/membership";

type LinkType = "account" | "membership" | "both";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
};

const dialogContentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export default function MembershipLinkFormModal({
  isOpen,
  onClose,
  onSave,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [membershipMasters, setMembershipMasters] = useState<
    MembershipMaster[]
  >([]);
  const [selectedMembershipMaster, setSelectedMembershipMaster] = useState<
    number | null
  >(null);
  const [loadingMasters, setLoadingMasters] = useState(false);

  const [linkType, setLinkType] = useState<LinkType>("account");

  const [accountSearch, setAccountSearch] = useState("");
  const [accountResults, setAccountResults] = useState<Account[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([]);
  const [isSearchingAccounts, setIsSearchingAccounts] = useState(false);

  const [membershipSearch, setMembershipSearch] = useState("");
  const [membershipResults, setMembershipResults] = useState<MembershipMaster[]>([]);
  const [selectedMemberships, setSelectedMemberships] = useState<membership[]>(
    []
  );
  const [isSearchingMemberships, setIsSearchingMemberships] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMembershipMasters = useCallback(async () => {
    try {
      setLoadingMasters(true);
      const res: Response<MembershipMaster[]> = await getMembershipMasters();
      setMembershipMasters(res?.data || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load membership masters",
        variant: "destructive",
      });
    } finally {
      setLoadingMasters(false);
    }
  }, []);

  useState(() => {
    if (!isOpen) {
      loadMembershipMasters();
    }
  });

  const searchAccount = useCallback(async () => {
    if (!accountSearch.trim()) {
      setAccountResults([]);
      return;
    }

    try {
      setIsSearchingAccounts(true);
      const res: Response<Account[]> = await getAccounts({
        accountName: accountSearch,
      });
      setAccountResults(res.data || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to search accounts",
        variant: "destructive",
      });
    } finally {
      setIsSearchingAccounts(false);
    }
  }, [accountSearch]);

  const searchMembership = useCallback(async () => {
    if (!membershipSearch.trim()) {
      setMembershipResults([]);
      return;
    }

    try {
      setIsSearchingMemberships(true);
      const res: Response<MembershipMaster[]> = await getMembershipMasters({
        search: membershipSearch,
      });
      setMembershipResults(res.data || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to search memberships",
        variant: "destructive",
      });
    } finally {
      setIsSearchingMemberships(false);
    }
  }, [membershipSearch]);

  const addAccount = (acc: Account) => {
    if (selectedAccounts.some((a) => a.accountId === acc.accountId)) return;
    setSelectedAccounts((p) => [...p, acc]);
  };

  const removeAccount = (id: number) => {
    setSelectedAccounts((p) => p.filter((a) => a.accountId !== id));
  };

  const addMembership = (membership: membership) => {
    if (
      selectedMemberships.some(
        (m) => m.membershipId === membership.membershipId
      )
    )
      return;
    setSelectedMemberships((p) => [...p, membership]);
  };

  const removeMembership = (id: number) => {
    setSelectedMemberships((p) => p.filter((m) => m.membershipId !== id));
  };

  const handleNext = () => {
    if (!selectedMembershipMaster) {
      toast({
        title: "Validation Error",
        description: "Please select a membership master first.",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (linkType === "account" && selectedAccounts.length === 0) {
      toast({
        title: "Validation Error",
        description: "Select at least one account to link.",
        variant: "destructive",
      });
      return;
    }

    if (linkType === "membership" && selectedMemberships.length === 0) {
      toast({
        title: "Validation Error",
        description: "Select at least one membership to link.",
        variant: "destructive",
      });
      return;
    }

    if (
      linkType === "both" &&
      selectedAccounts.length === 0 &&
      selectedMemberships.length === 0
    ) {
      toast({
        title: "Validation Error",
        description: "Select at least one account or membership to link.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (linkType === "account") {
        for (const acc of selectedAccounts) {
          const payload: MembershipLink = {
            membershipMasterId: selectedMembershipMaster!,
            accountId: acc.accountId,
            membershipId: undefined,
          };
          await createMembershipLink(payload);
        }
        toast({
          title: "Success",
          description: `Successfully linked ${selectedAccounts.length} account(s).`,
          variant: "success",
        });
      }

      if (linkType === "membership") {
        for (const membership of selectedMemberships) {
          const payload: MembershipLink = {
            membershipMasterId: selectedMembershipMaster!,
            accountId: undefined,
            membershipId: membership.membershipId,
          };
          await createMembershipLink(payload);
        }
        toast({
          title: "Success",
          description: `Successfully linked ${selectedMemberships.length} membership(s).`,
          variant: "success",
        });
      }

      if (linkType === "both") {
        for (const acc of selectedAccounts) {
          for (const membership of selectedMemberships) {
            const payload: MembershipLink = {
              membershipMasterId: selectedMembershipMaster!,
              accountId: acc.accountId,
              membershipId: membership.membershipId,
            };
            await createMembershipLink(payload);
          }
        }
        toast({
          title: "Success",
          description: `Successfully linked ${selectedAccounts.length} account(s) with ${selectedMemberships.length} membership(s).`,
          variant: "success",
        });
      }

      onSave();
      handleClose();
    } catch {
      toast({
        title: "Error",
        description: "Failed to create links. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedMembershipMaster(null);
    setLinkType("account");
    setAccountSearch("");
    setAccountResults([]);
    setSelectedAccounts([]);
    setMembershipSearch("");
    setMembershipResults([]);
    setSelectedMemberships([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-5xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-sm rounded-xl overflow-hidden"
        onPointerDownOutside={(e) => isSubmitting && e.preventDefault()}
        onInteractOutside={(e) => isSubmitting && e.preventDefault()}
      >
        <motion.div
          variants={dialogContentVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="flex flex-col max-h-[90vh] overflow-hidden"
        >
          <FormHeader
            title={step === 1 ? "Select Membership Master" : "Link Members"}
            icon={<Link2 className="w-5 h-5 text-primary" />}
            onClose={handleClose}
          />

          <div className="flex-grow p-6 overflow-y-auto">
            {step === 1 ? (
              <div className="space-y-6">
                <div className="bg-muted/30 p-6 rounded-lg border border-border/50">
                  <Label
                    htmlFor="membershipMaster"
                    className="text-lg font-semibold mb-3 block"
                  >
                    Choose Membership Master
                  </Label>
                  <Select
                    value={selectedMembershipMaster?.toString()}
                    onValueChange={(val) =>
                      setSelectedMembershipMaster(Number(val))
                    }
                  >
                    <SelectTrigger
                      id="membershipMaster"
                      className="w-full text-base"
                    >
                      <SelectValue placeholder="Select a membership master..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingMasters ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : membershipMasters.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          No membership masters available
                        </SelectItem>
                      ) : (
                        membershipMasters.map((master) => (
                          <SelectItem
                            key={master.membershipMasterId}
                            value={
                              master.membershipMasterId
                                ? master.membershipMasterId.toString()
                                : ""
                            }
                          >
                            {master.membershipType}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleNext}
                    disabled={!selectedMembershipMaster}
                    size="lg"
                    className="font-semibold"
                  >
                    Next <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Link Type Selection */}
                <div className="bg-muted/30 p-6 rounded-lg border border-border/50">
                  <Label className="text-lg font-semibold mb-4 block">
                    Select Link Type
                  </Label>
                  <RadioGroup
                    value={linkType}
                    onValueChange={(val) => setLinkType(val as LinkType)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="account" id="account" />
                      <Label
                        htmlFor="account"
                        className="cursor-pointer font-medium"
                      >
                        Link with Account Only
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="membership" id="membership" />
                      <Label
                        htmlFor="membership"
                        className="cursor-pointer font-medium"
                      >
                        Link with Membership Only
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="both" />
                      <Label
                        htmlFor="both"
                        className="cursor-pointer font-medium"
                      >
                        Link with Both Account and Membership
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {linkType === "account" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <AccountSearchPanel
                      search={accountSearch}
                      setSearch={setAccountSearch}
                      results={accountResults}
                      isSearching={isSearchingAccounts}
                      searchAccount={searchAccount}
                      addAccount={addAccount}
                      selectedAccounts={selectedAccounts}
                    />
                    <SelectedAccountsPanel
                      selectedAccounts={selectedAccounts}
                      removeAccount={removeAccount}
                    />
                  </div>
                )}

                {linkType === "membership" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <MembershipSearchPanel
                      search={membershipSearch}
                      setSearch={setMembershipSearch}
                      results={membershipResults}
                      isSearching={isSearchingMemberships}
                      searchMembership={searchMembership}
                      addMembership={addMembership}
                      selectedMemberships={selectedMemberships}
                    />
                    <SelectedMembershipsPanel
                      selectedMemberships={selectedMemberships}
                      removeMembership={removeMembership}
                    />
                  </div>
                )}

                {linkType === "both" && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <AccountSearchPanel
                        search={accountSearch}
                        setSearch={setAccountSearch}
                        results={accountResults}
                        isSearching={isSearchingAccounts}
                        searchAccount={searchAccount}
                        addAccount={addAccount}
                        selectedAccounts={selectedAccounts}
                      />
                      <SelectedAccountsPanel
                        selectedAccounts={selectedAccounts}
                        removeAccount={removeAccount}
                      />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <MembershipSearchPanel
                        search={membershipSearch}
                        setSearch={setMembershipSearch}
                        results={membershipResults}
                        isSearching={isSearchingMemberships}
                        searchMembership={searchMembership}
                        addMembership={addMembership}
                        selectedMemberships={selectedMemberships}
                      />
                      <SelectedMembershipsPanel
                        selectedMemberships={selectedMemberships}
                        removeMembership={removeMembership}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {step === 2 && (
            <FormFooter
              onClose={handleClose}
              onSubmit={handleSubmit}
              submitLabel="Create Links"
              isSubmitting={isSubmitting}
              disabled={
                (linkType === "account" && selectedAccounts.length === 0) ||
                (linkType === "membership" &&
                  selectedMemberships.length === 0) ||
                (linkType === "both" &&
                  selectedAccounts.length === 0 &&
                  selectedMemberships.length === 0)
              }
            />
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}