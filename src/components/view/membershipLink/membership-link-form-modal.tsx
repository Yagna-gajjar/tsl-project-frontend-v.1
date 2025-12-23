"use client";

import { useCallback, useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { toast } from "@/hooks/use-toast";
import { Link2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import AccountSearchPanel from "./account-search-panel";
import SelectedAccountsPanel from "./selected-accounts-panel";
import { createMembershipLink, getMembershipLinks } from "@/api/membershipLink.api";
import { getAccounts } from "@/api/account.api";
import type { MembershipLink } from "@/types/membershipLink";
import type { Response } from "@/types/response";
import type { Account } from "@/types/account";

type AccountWithLinkData = Account & {
  linkDate?: string;
  membershipLinkId?: number;
  isExisting?: boolean;
  contact?: string;
};

type MembershipData = {
  membershipMasterId: number;
  membershipTypeName: string;
  membershipId: number;
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
  const { membershipId, membershipMasterId, membershipTypeName } = membershipData || {};

  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<AccountWithLinkData[]>([]);
  const [accountSearch, setAccountSearch] = useState("");
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAllAccounts = useCallback(async () => {
    try {
      setIsSearching(true);
      const res: Response<Account[]> = await getAccounts({ accountType: "Transactions" });
      const accounts = res.data || [];
      setAllAccounts(accounts);
      setFilteredAccounts(accounts);
    } catch {
      toast({ title: "Error", description: "Failed to load accounts", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  }, []);

  const getAllLinkedAccount = useCallback(async () => {
    if (!membershipId || !membershipMasterId) return;

    try {
      const res: Response<MembershipLink[]> = await getMembershipLinks({
        membershipMasterId,
        membershipId,
      });

      const links = res.data || [];
      const alreadyLinked: AccountWithLinkData[] = links.map((link) => ({
        accountId: link.accountId,
        accountName: link.accountName || "Unknown Account",
        contact: link.contact,
        linkDate: link.linkDate,
        membershipLinkId: link.membershipLinkId,
        isExisting: true,
        dLinkDate: link.dLinkDate
      }));
      console.log(alreadyLinked," dhcbs");  

      setSelectedAccounts(alreadyLinked);
    } catch {
      toast({ title: "Error", description: "Failed to load linked accounts", variant: "destructive" });
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
    const filtered = allAccounts.filter((acc) =>
      acc.accountName?.toLowerCase().includes(searchLower) ||
      acc.contact?.toLowerCase().includes(searchLower)
    );
    setFilteredAccounts(filtered);
  }, [accountSearch, allAccounts]);

  const addAccount = (acc: Account) => {
    if (!selectedAccounts.some((a) => a.accountId === acc.accountId)) {
      setSelectedAccounts([...selectedAccounts, { ...acc, isExisting: false }]);
    }
  };

  const removeAccount = (id: number) => {
    // Logic: If it's a new addition, just remove from state. 
    // If it's an existing link, you might want to call an 'Unlink' API here or mark it for deletion.
    setSelectedAccounts(selectedAccounts.filter((acc) => acc.accountId !== id));
  };

  const handleSubmit = async () => {
    // Only submit accounts that aren't already linked (isExisting: false)
    const newAccounts = selectedAccounts.filter(acc => !acc.isExisting);

    if (newAccounts.length === 0) {
      toast({ title: "Info", description: "No new accounts to link." });
      return;
    }

    try {
      setIsSubmitting(true);
      for (const account of newAccounts) {
        await createMembershipLink({
          membershipMasterId: membershipMasterId,
          accountId: account.accountId,
          membershipId: membershipId,
        });
      }

      toast({
        title: "Success",
        description: `Successfully updated links for ${membershipTypeName}.`,
        variant: "success",
      });

      onSave();
      handleClose();
    } catch {
      toast({ title: "Error", description: "Failed to create links.", variant: "destructive" });
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
      <DialogContent className="max-w-6xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-sm rounded-xl overflow-hidden">
        <motion.div variants={dialogContentVariants} initial="hidden" animate="visible" className="flex flex-col max-h-[90vh] overflow-hidden">
          <FormHeader title="Manage Membership Links" icon={<Link2 className="w-5 h-5 text-primary" />} onClose={handleClose} />

          <div className="flex-grow overflow-y-auto p-6 space-y-6">
            {/* Header Info */}
            <div className="bg-muted/40 border border-border/50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-full"><ShieldCheck className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target Membership</p>
                  <p className="text-lg font-bold text-foreground">{membershipTypeName}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs bg-background px-2 py-1 rounded border border-border font-mono">
                  ID: {membershipId}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Account Management</Label>
              <div className="grid grid-cols-2 gap-6">
                <AccountSearchPanel
                  search={accountSearch}
                  setSearch={setAccountSearch}
                  results={filteredAccounts}
                  isSearching={isSearching}
                  searchAccount={async () => { }}
                  addAccount={addAccount}
                  selectedAccounts={selectedAccounts}
                />

                {/* Note: You will need to update SelectedAccountsPanel to 
                   handle the display of linkDate and the Unlink icon.
                */}
                <SelectedAccountsPanel
                  selectedAccounts={selectedAccounts}
                  removeAccount={removeAccount}
                // Pass custom render or props if your component supports it
                />
              </div>
            </div>
          </div>

          <FormFooter
            onClose={handleClose}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
            isSubmitting={isSubmitting}
            disabled={isSubmitting}
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}