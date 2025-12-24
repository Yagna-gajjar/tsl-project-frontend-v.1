"use client";

import { useCallback, useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { toast } from "@/hooks/use-toast";
import { Link2, ShieldCheck, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AccountSearchPanel from "./account-search-panel";
import SelectedAccountsPanel from "./selected-accounts-panel";
import {
  createMembershipLink,
  getMembershipLinks,
  deleteMembershipLink,
  updateMembershipLink,
} from "@/api/membershipLink.api";
import { getAccounts } from "@/api/account.api";
import type { MembershipLink } from "@/types/membershipLink";
import type { Response } from "@/types/response";
import type { Account } from "@/types/account";

type AccountWithLinkData = Account & {
  linkDate?: string;
  dLinkDate?: string | null;
  membershipLinkId?: number;
  isExisting?: boolean;
  contact?: string;
};

type MembershipData = {
  membershipMasterId: number;
  membershipTypeName: string;
  membershipId: number;
  members?: number;
  entityName?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  membershipData: MembershipData;
};

const dialogContentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export default function MembershipLinkFormModal({
  isOpen,
  onClose,
  onSave,
  membershipData,
}: Props) {
  const {
    membershipId,
    membershipMasterId,
    membershipTypeName,
    members,
    entityName,
  } = membershipData || {};

  const [selectedAccounts, setSelectedAccounts] = useState<
    AccountWithLinkData[]
  >([]);
  const [accountSearch, setAccountSearch] = useState("");
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [accountPage, setaccountPage] = useState(1);
  const [hasMoreAccount, setHasMoreAccount] = useState(true);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const PAGE_SIZE = 20;

  const loadAllAccounts = useCallback(
    async (isInitial = false) => {
      if (loadingAccount || (!hasMoreAccount && !isInitial)) return;
      setLoadingAccount(true);
      try {
        const page = isInitial ? 1 : accountPage;
        const response: Response<Account[]> = await getAccounts({
          limit: PAGE_SIZE,
          page,
          accountType: "Transactions",
          entityType: "Family",
        });
        const items = response?.data || ([] as Account[]);
        setAllAccounts((prev) => (isInitial ? items : [...prev, ...items]));
        setHasMoreAccount(items.length === PAGE_SIZE);
        setaccountPage(page + 1);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch members",
          variant: "destructive",
        });
      } finally {
        setLoadingAccount(false);
      }
    },
    [loadingAccount, hasMoreAccount, accountPage]
  );

  const getAllLinkedAccount = useCallback(async () => {
    if (!membershipMasterId) return;

    try {
      const res: Response<MembershipLink[]> = await getMembershipLinks({
        membershipMasterId,
        membershipId: membershipId ? membershipId : undefined,
      });

      const links = res.data || [];
      const alreadyLinked: AccountWithLinkData[] = links.map((link) => ({
        accountId: link.accountId,
        accountName: link.accountName || "Unknown Account",
        contact: link.contact,
        linkDate: link.linkDate,
        dLinkDate: link.dLinkDate,
        membershipLinkId: link.membershipLinkId,
        isExisting: true,
      }));

      setSelectedAccounts(alreadyLinked);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load linked accounts",
        variant: "destructive",
      });
    }
  }, [membershipId, membershipMasterId]);

  useEffect(() => {
    if (isOpen) {
      loadAllAccounts();
      getAllLinkedAccount();
    }
  }, [isOpen, loadAllAccounts, getAllLinkedAccount]);

  useEffect(() => {
    const searchLower = accountSearch.toLowerCase();
    const filtered = allAccounts.filter(
      (acc) =>
        acc.accountName?.toLowerCase().includes(searchLower) ||
        acc.contact?.toLowerCase().includes(searchLower)
    );
    setFilteredAccounts(filtered);
  }, [accountSearch, allAccounts]);

  const calculateValidation = () => {
    const currentLinked = selectedAccounts.filter(
      (acc) => acc.isExisting && !acc.dLinkDate
    ).length;
    const toUnlink = selectedAccounts.filter((acc) => acc.dLinkDate).length;
    const newLinked = selectedAccounts.filter((acc) => !acc.isExisting).length;

    const newTotal = currentLinked + newLinked;

    const exceeded = members ? newTotal - members : 0;
    const isValid = members ? newTotal <= members : true;

    return { newTotal, exceeded, isValid, currentLinked, toUnlink, newLinked };
  };

  const validation = calculateValidation();

  const addAccount = (acc: Account) => {
    if (!selectedAccounts.some((a) => a.accountId === acc.accountId)) {
      setSelectedAccounts([{ ...acc, isExisting: false }, ...selectedAccounts]);
    }
  };

  const removeAccount = (id: number) => {
    setSelectedAccounts(selectedAccounts.filter((acc) => acc.accountId !== id));
  };

  const toggleLinkStatus = async (account: AccountWithLinkData) => {
    if (account.isExisting && !account.dLinkDate) {
      await updateMembershipLink(Number(account.membershipLinkId), {
        dLinkDate: new Date().toISOString(),
      });

      setSelectedAccounts(
        selectedAccounts.map((acc) =>
          acc.accountId === account.accountId
            ? { ...acc, dLinkDate: new Date().toISOString() }
            : acc
        )
      );
    } else if (account.isExisting && account.dLinkDate) {
      await updateMembershipLink(Number(account.membershipLinkId), {
        dLinkDate: undefined,
      });

      setSelectedAccounts(
        selectedAccounts.map((acc) =>
          acc.accountId === account.accountId
            ? { ...acc, dLinkDate: null }
            : acc
        )
      );
    } else {
      removeAccount(account.accountId!);
    }
  };

  const handleSubmit = async () => {
    const newAccounts = selectedAccounts.filter((acc) => !acc.isExisting);
    const unlinkedAccounts = selectedAccounts.filter((acc) => acc.dLinkDate);

    // Check validation for new accounts
    if (newAccounts.length > 0) {
      if (!validation.isValid) {
        toast({
          title: "Limit Exceeded",
          description: `${validation.exceeded} account${
            validation.exceeded > 1 ? "s" : ""
          } exceed the limit of ${members} accounts.`,
          variant: "destructive",
        });
        return;
      }
    }

    if (newAccounts.length === 0 && unlinkedAccounts.length === 0) {
      toast({ title: "Info", description: "No changes to save." });
      return;
    }

    try {
      setIsSubmitting(true);

      // Link new accounts
      for (const account of newAccounts) {
        await createMembershipLink({
          membershipMasterId: membershipMasterId,
          accountId: account.accountId,
          membershipId: membershipId,
        });
      }

      // Unlink accounts
      for (const account of unlinkedAccounts) {
        if (account.membershipLinkId) {
          await deleteMembershipLink({
            membershipLinkId: account.membershipLinkId,
            membershipMasterId,
          });
        }
      }

      const totalChanges = newAccounts.length + unlinkedAccounts.length;
      toast({
        title: "Success",
        description: `Successfully updated ${totalChanges} account${
          totalChanges > 1 ? "s" : ""
        }.`,
        variant: "success",
      });

      onSave();
      handleClose();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update links.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedAccounts([]);
    setAccountSearch("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-6xl p-0 border-border/50 shadow-2xl bg-background backdrop-blur-sm rounded-xl overflow-hidden">
        <motion.div
          variants={dialogContentVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col max-h-[90vh] overflow-hidden"
        >
          <FormHeader
            title="Manage Membership Links"
            icon={<Link2 className="w-5 h-5 text-primary" />}
            onClose={handleClose}
          />

          <div className="flex-grow overflow-y-auto px-8 pt-4 space-y-4">
            {/* Header Info */}
            <div className="bg-gradient-to-r from-primary/8 to-primary/4 border border-primary/20 rounded-lg px-5 py-3 flex items-center justify-between hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/15 rounded-full">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">
                    {membershipTypeName}
                  </p>
                  {membershipId !== 0 && (
                    <p className="text-xs font-mono text-muted-foreground hover:bg-background transition-colors">
                      {entityName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {!validation.isValid &&
              selectedAccounts.some((acc) => !acc.isExisting) && (
                <Alert
                  variant="destructive"
                  className="border-destructive/50 bg-destructive/5"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-semibold">
                      {validation.exceeded} account
                      {validation.exceeded > 1 ? "s" : ""} exceed the limit of{" "}
                      {members} accounts.
                    </span>
                    <p className="text-xs mt-1 text-destructive/80">
                      Current: {validation.currentLinked}, Unlinking:{" "}
                      {validation.toUnlink}, New: {validation.newLinked} =
                      Total: {validation.newTotal}
                    </p>
                  </AlertDescription>
                </Alert>
              )}

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">
                Account Management
              </Label>
              <div className="grid grid-cols-2 gap-6">
                <AccountSearchPanel
                  search={accountSearch}
                  setSearch={setAccountSearch}
                  results={filteredAccounts}
                  isSearching={isSearching}
                  searchAccount={async () => {}}
                  addAccount={addAccount}
                  selectedAccounts={selectedAccounts}
                />
                <SelectedAccountsPanel
                  selectedAccounts={selectedAccounts}
                  memberLimit={members}
                  removeAccount={removeAccount}
                  toggleLinkStatus={toggleLinkStatus}
                />
              </div>
            </div>
          </div>

          <FormFooter
            onClose={handleClose}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
            isSubmitting={isSubmitting}
            disabled={
              isSubmitting ||
              (!validation.isValid &&
                selectedAccounts.some((acc) => !acc.isExisting))
            }
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
