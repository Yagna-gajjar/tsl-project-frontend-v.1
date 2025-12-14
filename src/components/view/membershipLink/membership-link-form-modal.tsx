import { useCallback, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { toast } from "@/hooks/use-toast";
import { Users } from "lucide-react";
import { motion } from "framer-motion";

import AccountSearchPanel from "./AccountSearchPanel";
import SelectedAccountsPanel from "./SelectedAccountsPanel";

import { createMembershipLink } from "@/api/membershipLink.api";
import { getAccounts } from "@/api/account.api";
import type { MembershipLink } from "@/types/membershipLink";
import type { Response } from "@/types/response";

export type Account = {
  accountId: number;
  name: string;
  phone?: string;
};

type Props = {
  isOpen: boolean;
  membershipId: number;
  membershipMasterId: number;
  onClose: () => void;
  onSave: () => void;
};

const dialogContentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export default function MembershipLinkFormModal({
  isOpen,
  membershipId,
  membershipMasterId,
  onClose,
  onSave,
}: Props) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Account[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchAccount = useCallback(async () => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const res: Response<Account[]> = await getAccounts({ name: search });
      setResults(res.data || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to search accounts",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [search]);

  const addAccount = (acc: Account) => {
    if (selectedAccounts.some((a) => a.accountId === acc.accountId)) return;
    setSelectedAccounts((p) => [...p, acc]);
  };

  const removeAccount = (id: number) => {
    setSelectedAccounts((p) => p.filter((a) => a.accountId !== id));
  };

  const handleSubmit = async () => {
    if (selectedAccounts.length === 0) {
      toast({
        title: "Validation Error",
        description: "Select at least one account to link.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      for (const acc of selectedAccounts) {
        const payload: MembershipLink = {
          membershipId,
          membershipMasterId,
          accountId: acc.accountId,
        };
        await createMembershipLink(payload);
      }

      toast({
        title: "Success",
        description: `Successfully linked ${selectedAccounts.length} account(s).`,
        variant: "success",
      });

      onSave();
      onClose();
    } catch {
      toast({
        title: "Error",
        description: "Failed to link one or more accounts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-4xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-sm rounded-xl overflow-hidden"
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
            title="Link Family / Accounts"
            icon={<Users className="w-5 h-5 text-primary" />}
            onClose={onClose}
          />

          <div className="flex-grow p-6 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AccountSearchPanel
                search={search}
                setSearch={setSearch}
                results={results}
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

          <FormFooter
            onClose={onClose}
            onSubmit={handleSubmit}
            submitLabel="Link Accounts"
            isSubmitting={isSubmitting}
            disabled={selectedAccounts.length === 0}
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
