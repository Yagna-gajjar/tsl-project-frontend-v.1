"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Account } from "@/types/account";
import { Users, Trash2, Unlink, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Updated type to include the metadata from the modal
type AccountWithLinkData = Account & {
  linkDate?: string;
  dLinkDate?: string | null;
  isExisting?: boolean;
};

type Props = {
  selectedAccounts: AccountWithLinkData[];
  removeAccount: (id: number) => void;
  onUnlink?: (id: number) => void; // Optional: if you want a separate API call for unlinking
};

export default function SelectedAccountsPanel({
  selectedAccounts,
  removeAccount,
  onUnlink,
}: Props) {
  // Count only those that are currently active (isExisting AND dlinkDate is null)
  const activeLinkedCount = selectedAccounts.filter(
    (acc) => acc.isExisting && !acc.dLinkDate
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end border-b pb-2">
        <h3 className="font-extrabold text-xl text-primary tracking-wide">
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Selected Accounts ({selectedAccounts.length})
          </span>
        </h3>
        <span className="text-xs font-medium text-muted-foreground italic">
          Active Links: {activeLinkedCount}
        </span>
      </div>

      <div className="border border-border/70 rounded-lg bg-background shadow-inner h-80 transition-shadow duration-300">
        <ScrollArea className="h-full">
          {selectedAccounts.length > 0 ? (
            selectedAccounts.map((acc) => {
              const isLinked = acc.isExisting && !acc.dLinkDate;
              const isDlinked = !!acc.dLinkDate;

              return (
                <div
                  key={acc.accountId}
                  className={`flex justify-between items-center p-3 border-b border-primary/10 last:border-b-0 ${isDlinked ? "opacity-50 bg-muted/50" : "bg-secondary/10"
                    }`}
                >
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {acc.accountName}
                      </span>
                      {isLinked && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 bg-green-50 text-green-700 border-green-200">
                          Linked
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground text-xs font-mono">{`ID: ${acc.accountId}`}</span>
                      {acc.linkDate && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Linked: {new Date(acc.linkDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isLinked ? (
                      // Case 1: Already linked and active (dlinkDate is null)
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUnlink ? onUnlink(acc.accountId) : removeAccount(acc.accountId)}
                        className="h-8 w-8 p-0 border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        title="Unlink Account"
                      >
                        <Unlink className="w-4 h-4" />
                      </Button>
                    ) : isDlinked ? (
                      // Case 2: Already unlinked (dlinkDate exists)
                      <span className="text-xs text-muted-foreground font-medium px-2">
                        Unlinked
                      </span>
                    ) : (
                      // Case 3: New staged account (not in DB yet)
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeAccount(acc.accountId)}
                        className="h-8 w-8 p-0"
                        title="Remove from selection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <Users className="w-12 h-12 opacity-20 mb-2" />
              <p>No accounts selected.</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}