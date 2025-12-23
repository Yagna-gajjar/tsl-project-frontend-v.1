"use client";

import { useCallback, useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { toast } from "@/hooks/use-toast";
import { Link2 } from "lucide-react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import AccountSearchPanel from "./account-search-panel";
import SelectedAccountsPanel from "./selected-accounts-panel";
import { createMembershipLink } from "@/api/membershipLink.api";
import { getAccounts } from "@/api/account.api";
import { getMembershipMasters } from "@/api/membershipMaster.api";
import type { MembershipLink } from "@/types/membershipLink";
import type { Response } from "@/types/response";
import type { Account } from "@/types/account";
import type { MembershipMaster } from "@/types/membershipMaster";
import type { membership } from "@/types/membership";
import { SearchableMultiselect } from "@/components/form-modal/form-field-input";
import { getMembers } from "@/api/member.api";
import { getMemberships } from "@/api/membership.api";

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
  const [membershipMasters, setMembershipMasters] = useState<
    MembershipMaster[]
  >([]);
  const [selectedMembershipMaster, setSelectedMembershipMaster] = useState<
    number | null
  >(null);
  const [loadingMasters, setLoadingMasters] = useState(false);

  const [selectedMembership, setSelectedMembership] = useState<number | null>(
    null
  );
  const [membershipOptions, setMembershipOptions] = useState<membership[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(false);

  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([]);
  const [accountSearch, setAccountSearch] = useState("");
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const loadMemberships = useCallback(async (masterId: number) => {
    try {
      setLoadingMemberships(true);
      const res: Response<membership[]> = await getMemberships();

      setMembershipOptions(res?.data as membership[]);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load memberships",
        variant: "destructive",
      });
    } finally {
      setLoadingMemberships(false);
    }
  }, []);

  const loadAllAccounts = useCallback(async () => {
    try {
      setIsSearching(true);
      const res: Response<Account[]> = await getAccounts({});
      const accounts = res.data || [];
      setAllAccounts(accounts);
      setFilteredAccounts(accounts);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadMembershipMasters();
      loadAllAccounts();
    }
  }, [isOpen, loadMembershipMasters, loadAllAccounts]);

  useEffect(() => {
    if (selectedMembershipMaster) {
      loadMemberships(selectedMembershipMaster);
    }
  }, [selectedMembershipMaster, loadMemberships]);

  useEffect(() => {
    if (!accountSearch.trim()) {
      setFilteredAccounts(allAccounts);
    } else {
      const searchLower = accountSearch.toLowerCase();
      const filtered = allAccounts.filter(
        (acc) =>
          acc.accountName?.toLowerCase().includes(searchLower) ||
          acc.contact?.toLowerCase().includes(searchLower) ||
          acc.email?.toLowerCase().includes(searchLower)
      );
      setFilteredAccounts(filtered);
    }
  }, [accountSearch, allAccounts]);

  const searchAccount = async () => {
    // Already filtered in useEffect above
  };

  const addAccount = (acc: Account) => {
    if (!selectedAccounts.some((a) => a.accountId === acc.accountId)) {
      setSelectedAccounts([...selectedAccounts, acc]);
    }
  };

  const removeAccount = (id: number) => {
    setSelectedAccounts(selectedAccounts.filter((acc) => acc.accountId !== id));
  };

  const handleSubmit = async () => {
    if (!selectedMembershipMaster) {
      toast({
        title: "Validation Error",
        description: "Please select a membership master.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMembership) {
      toast({
        title: "Validation Error",
        description: "Please select a membership.",
        variant: "destructive",
      });
      return;
    }

    if (selectedAccounts.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one account.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      let linksCreated = 0;
      for (const account of selectedAccounts) {
        const payload: MembershipLink = {
          membershipMasterId: selectedMembershipMaster,
          accountId: account.accountId,
          membershipId: selectedMembership,
        };
        await createMembershipLink(payload);
        linksCreated++;
      }

      toast({
        title: "Success",
        description: `Successfully linked ${linksCreated} account(s) to the membership.`,
        variant: "success",
      });

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
    setSelectedMembershipMaster(null);
    setSelectedMembership(null);
    setSelectedAccounts([]);
    setAccountSearch("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-6xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-sm rounded-xl overflow-hidden"
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
            title="Link Membership Type to Accounts"
            icon={<Link2 className="w-5 h-5 text-primary" />}
            onClose={handleClose}
          />

          <div className="flex-grow overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                {/* Membership Master Selection */}
                <div className="space-y-2">
                  <Label htmlFor="membership" className="text-sm font-semibold">
                    Membership Master
                  </Label>
                  <SearchableMultiselect
                    options={membershipMasters?.map((m) => ({
                      value: m.membershipMasterId,
                      label: m.membershipType,
                    }))}
                    value={selectedMembershipMaster}
                    onChange={setSelectedMembershipMaster}
                    placeholder="Search and select a membership master..."
                    isSingle={true}
                  />
                </div>

                {/* Membership Selection */}
                <div className="space-y-2">
                  <Label htmlFor="membership" className="text-sm font-semibold">
                    Membership
                  </Label>
                  <SearchableMultiselect
                    options={membershipOptions
                      ?.filter((m) => m.accountId !== null)
                      .map((m) => ({
                        value: m.membershipId,
                        label: m.accountName,
                      }))}
                    value={selectedMembership}
                    onChange={setSelectedMembership}
                    placeholder="Search and select a membership..."
                    disabled={loadingMemberships || !selectedMembershipMaster}
                    isSingle={true}
                  />
                </div>
              </div>

              {/* Account Selection Panels */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Select Accounts</Label>
                <div className="grid grid-cols-2 gap-6">
                  <AccountSearchPanel
                    search={accountSearch}
                    setSearch={setAccountSearch}
                    results={filteredAccounts}
                    isSearching={isSearching}
                    searchAccount={searchAccount}
                    addAccount={addAccount}
                    selectedAccounts={selectedAccounts}
                  />
                  <SelectedAccountsPanel
                    selectedAccounts={selectedAccounts}
                    removeAccount={removeAccount}
                  />
                </div>
              </div>
            </div>
          </div>

          <FormFooter
            onClose={handleClose}
            onSubmit={handleSubmit}
            submitLabel="Create Link"
            isSubmitting={isSubmitting}
            disabled={
              !selectedMembershipMaster ||
              !selectedMembership ||
              selectedAccounts.length === 0
            }
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
