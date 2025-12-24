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

import {
  createMembershipLink,
  getMembershipLinks,
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
};

type UnlinkPreviewItem = {
  membershipLinkId: number;
  dLinkDate: string;
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
  visible: { opacity: 1, y: 0 },
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

  const [selectedAccounts, setSelectedAccounts] = useState<AccountWithLinkData[]>([]);
  const [unlinkPreview, setUnlinkPreview] = useState<UnlinkPreviewItem[]>([]);
  const [accountSearch, setAccountSearch] = useState("");
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [accountPage, setAccountPage] = useState(1);
  const [hasMoreAccount, setHasMoreAccount] = useState(true);
  const [loadingAccount, setLoadingAccount] = useState(false);

  const PAGE_SIZE = 20;


  const loadAllAccounts = useCallback(async () => {
    if (loadingAccount || !hasMoreAccount) return;

    setLoadingAccount(true);
    try {
      const res: Response<Account[]> = await getAccounts({
        limit: PAGE_SIZE,
        page: accountPage,
        accountType: "Transactions",
        entityType: "Family",
      });

      const items = res.data ?? [];
      setAllAccounts((p) => [...p, ...items]);
      setHasMoreAccount(items.length === PAGE_SIZE);
      setAccountPage((p) => p + 1);
    } catch {
      toast({ title: "Error", description: "Failed to load accounts", variant: "destructive" });
    } finally {
      setLoadingAccount(false);
    }
  }, [accountPage, hasMoreAccount, loadingAccount]);


  const loadLinkedAccounts = useCallback(async () => {
    if (!membershipMasterId) return;

    const res: Response<MembershipLink[]> = await getMembershipLinks({
      membershipMasterId,
      membershipId,
    });

    const linked = (res.data ?? []).map((l) => ({
      accountId: l.accountId,
      accountName: l.accountName ?? "Unknown",
      contact: l.contact,
      linkDate: l.linkDate,
      dLinkDate: l.dLinkDate,
      membershipLinkId: l.membershipLinkId,
      isExisting: true,
    }));

    setSelectedAccounts(linked);
  }, [membershipId, membershipMasterId]);


  useEffect(() => {
    if (!isOpen) return;
    loadAllAccounts();
    loadLinkedAccounts();
  }, [isOpen]);

  useEffect(() => {
    const q = accountSearch.toLowerCase();
    setFilteredAccounts(
      allAccounts.filter(
        (a) =>
          a.accountName?.toLowerCase().includes(q) ||
          a.contact?.toLowerCase().includes(q)
      )
    );
  }, [accountSearch, allAccounts]);

  useEffect(() => {
    if (!members) return;
  
    const effectiveCount =
      selectedAccounts.filter((a) => a.isExisting && !a.dLinkDate).length +
      selectedAccounts.filter((a) => !a.isExisting).length -
      unlinkPreview.length;
  
    if (effectiveCount === members) {
      toast({
        title: "Limit reached",
        description: "You are at the maximum allowed members.",
      });
    }
  }, [unlinkPreview]);
  

  const addAccount = (acc: Account) => {
    if (selectedAccounts.some((a) => a.accountId === acc.accountId)) return;
  
    const nextSelected = [{ ...acc, isExisting: false }, ...selectedAccounts];
  
    const effectiveCount = getEffectiveMemberCount(nextSelected);
  
    if (members && effectiveCount > members) {
      toast({
        title: "Member limit reached",
        description: `You can link only ${members} accounts. Remove or de-link an account first.`,
        variant: "destructive",
      });
      return; 
    }
    setSelectedAccounts(nextSelected);
  };
  
  

  const removeAccount = (id: number) => {
    setSelectedAccounts((p) => p.filter((a) => a.accountId !== id));
  };

  const getEffectiveMemberCount = (
    nextSelectedAccounts: AccountWithLinkData[],
    nextUnlinkPreview = unlinkPreview
  ) => {
    const activeExisting = nextSelectedAccounts.filter(
      (a) => a.isExisting && !a.dLinkDate
    ).length;
  
    const newSelected = nextSelectedAccounts.filter(
      (a) => !a.isExisting
    ).length;
  
    return activeExisting + newSelected - nextUnlinkPreview.length;
  };
  

  const handleSubmit = async () => {
    // -------- LIMIT VALIDATION --------
    const activeExisting = selectedAccounts.filter(
      (a) => a.isExisting && !a.dLinkDate
    ).length;
  
    const newSelected = selectedAccounts.filter(
      (a) => !a.isExisting
    ).length;
  
    const effectiveCount =
      activeExisting + newSelected - unlinkPreview.length;
  
    if (members && effectiveCount > members) {
      toast({
        title: "Member limit exceeded",
        description: `You can link only ${members} accounts. You are trying to link ${effectiveCount}.`,
        variant: "destructive",
      });
      return; // ❌ STOP SUBMIT
    }
  
    try {
      setIsSubmitting(true);
  
      // CREATE NEW LINKS
      for (const acc of selectedAccounts.filter((a) => !a.isExisting)) {
        await createMembershipLink({
          membershipMasterId,
          membershipId,
          accountId: acc.accountId!,
        });
      }
  
      // APPLY UNLINKS
      for (const u of unlinkPreview) {
        await updateMembershipLink(u.membershipLinkId, {
          dLinkDate: u.dLinkDate,
        });
      }
  
      toast({
        title: "Success",
        description: "Membership links updated",
        variant: "success",
      });
  
      onSave();
      handleClose();
    } catch {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  

  const handleClose = () => {
    setSelectedAccounts([]);
    setUnlinkPreview([]);
    setAccountSearch("");
    onClose();
  };

  /* ---------------- UI ---------------- */

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-6xl p-0 border-border/50 shadow-2xl bg-background backdrop-blur-sm rounded-xl overflow-hidden">
        <motion.div variants={dialogContentVariants} initial="hidden" animate="visible">
          <FormHeader
            title="Manage Membership Links"
            icon={<Link2 className="w-5 h-5" />}
            onClose={handleClose}
          />

          <div className="px-8 py-4 space-y-4">
            <div>
              <p className="text-xl font-bold">{membershipTypeName}</p>
              {membershipId !== 0 && <p className="text-base">{entityName}</p>}
            </div>


            <div className="grid grid-cols-2 gap-6">
              <AccountSearchPanel
                search={accountSearch}
                setSearch={setAccountSearch}
                results={filteredAccounts}
                addAccount={addAccount}
                selectedAccounts={selectedAccounts}
              />

              <SelectedAccountsPanel
                selectedAccounts={selectedAccounts}
                memberLimit={members}
                unlinkPreview={unlinkPreview}
                setUnlinkPreview={setUnlinkPreview}
                removeAccount={removeAccount}
              />
            </div>
          </div>

          <FormFooter
            onClose={handleClose}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
            isSubmitting={isSubmitting}
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
