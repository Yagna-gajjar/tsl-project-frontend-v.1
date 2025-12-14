import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { createMembershipLink } from "@/api/membershipLink.api";
import { getAccounts } from "@/api/account.api";
import type { MembershipLink } from "@/types/membershipLink";
import { toast } from "@/hooks/use-toast";

type Props = {
  isOpen: boolean;
  membershipId: number;
  membershipMasterId: number;
  onClose: () => void;
  onSave: () => void;
};

export default function MembershipLinkFormModal({
  isOpen,
  membershipId,
  membershipMasterId,
  onClose,
  onSave,
}: Props) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchAccount = useCallback(async () => {
    if (!search.trim()) return;

    try {
      const res = await getAccounts({ name: search });
      setResults(res.data || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to search accounts",
        variant: "destructive",
      });
    }
  }, [search]);

  const addAccount = (acc: any) => {
    if (selectedAccounts.some((a) => a.accountId === acc.accountId)) return;
    setSelectedAccounts((p) => [...p, acc]);
  };

  const removeAccount = (id: number) => {
    setSelectedAccounts((p) => p.filter((a) => a.accountId !== id));
  };

  const handleSubmit = async () => {
    if (selectedAccounts.length === 0) {
      toast({
        title: "Validation",
        description: "Select at least one account",
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
        description: "Accounts linked successfully",
        variant: "success",
      });

      onSave();
      onClose();
    } catch {
      toast({
        title: "Error",
        description: "Failed to link accounts",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
      <div className="flex flex-col max-h-[90vh] overflow-hidden">
        
              <FormHeader title="Add Accounts to Membership" onClose={onClose} />

        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* SEARCH SIDE */}
          <div>
            <h3 className="font-semibold mb-2">Search Accounts</h3>

            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Search by name / phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button onClick={searchAccount}>Search</Button>
            </div>

            <div className="border rounded-md max-h-64 overflow-auto">
              {results.map((acc) => (
                <div
                  key={acc.accountId}
                  className="flex justify-between items-center p-2 border-b"
                >
                  <span>{acc.name}</span>
                  <Button size="sm" onClick={() => addAccount(acc)}>
                    Add
                  </Button>
                </div>
              ))}

              {results.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">No results</p>
              )}
            </div>
          </div>

          {/* SELECTED SIDE */}
          <div>
            <h3 className="font-semibold mb-2">Selected Accounts</h3>

            <div className="border rounded-md max-h-64 overflow-auto">
              {selectedAccounts.map((acc) => (
                <div
                  key={acc.accountId}
                  className="flex justify-between items-center p-2 border-b"
                >
                  <span>{acc.name}</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeAccount(acc.accountId)}
                  >
                    Remove
                  </Button>
                </div>
              ))}

              {selectedAccounts.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">
                  No accounts selected
                </p>
              )}
            </div>
          </div>
        </div>

        <FormFooter
          onClose={onClose}
          onSubmit={handleSubmit}
          submitLabel="Link Accounts"
          isSubmitting={isSubmitting}
                  />
                  </div>
      </DialogContent>
    </Dialog>
  );
}
