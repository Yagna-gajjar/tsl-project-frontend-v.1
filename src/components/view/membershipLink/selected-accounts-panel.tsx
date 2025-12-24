"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Account } from "@/types/account";
import { Users, Trash2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AccountWithLinkData = Account & {
  linkDate?: string;
  dLinkDate?: string | null;
  isExisting?: boolean;
  membershipLinkId?: number;
  accountId?: number;
};

type Props = {
  selectedAccounts: AccountWithLinkData[];
  removeAccount: (id: number) => void;
  memberLimit?: number;
};

export default function SelectedAccountsPanel({
  selectedAccounts,
  removeAccount,
  memberLimit,
}: Props) {
  /** 🔥 UI-only preview state (NOT SAVED) */
  const [unlinkPreview, setUnlinkPreview] = useState<Record<number, boolean>>(
    {}
  );

  const activeLinkedCount = selectedAccounts.filter(
    (acc) => acc.isExisting && !acc.dLinkDate
  ).length;

  const inactiveLinkedCount = selectedAccounts.filter(
    (acc) => acc.isExisting && acc.dLinkDate
  ).length;

  return (
    <div className="space-y-4">
      {Number(memberLimit) > 0 && (
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground">Accounts</h2>
            <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/10 px-2 py-0.5 rounded text-xs font-semibold text-primary">
              Limit: {selectedAccounts.length - inactiveLinkedCount}/
              {memberLimit}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium">
                {activeLinkedCount} Linked
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-sm font-medium">
                {selectedAccounts.length -
                  activeLinkedCount -
                  inactiveLinkedCount}{" "}
                New
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="text-sm font-medium text-muted-foreground">
                {inactiveLinkedCount} De-linked
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="border border-border/40 rounded-lg bg-background/30 shadow-sm h-80 overflow-hidden">
        <ScrollArea className="h-full">
          {selectedAccounts.length > 0 ? (
            <div className="divide-y divide-border/30">
              {selectedAccounts.map((acc) => {
                const isLinked = acc.isExisting && !acc.dLinkDate;
                const isNew = !acc.isExisting;

                const isMarkedForUnlink =
                  unlinkPreview[acc.accountId!] ?? !!acc.dLinkDate;

                return (
                  <div
                    key={acc.accountId}
                    className={`flex justify-between items-center p-3.5 transition-all ${
                      isMarkedForUnlink
                        ? "opacity-60 bg-muted/30"
                        : "hover:bg-accent/40"
                    }`}
                  >
                    {/* LEFT */}
                    <div className="text-sm space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {acc.accountName}
                        </span>

                        {isLinked && !isMarkedForUnlink && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 px-1.5 bg-green-50 text-green-700 border-green-200"
                          >
                            Linked
                          </Badge>
                        )}

                        {isNew && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 px-1.5 bg-blue-50 text-blue-700 border-blue-200"
                          >
                            Pending
                          </Badge>
                        )}

                        {isMarkedForUnlink && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 px-1.5 bg-orange-50 text-orange-700 border-orange-200"
                          >
                            To Unlink
                          </Badge>
                        )}
                      </div>

                        {acc.linkDate && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3 opacity-60" />
                            {new Date(acc.linkDate).toLocaleDateString()}
                          </span>
                        )}
                    </div>

                    {/* RIGHT */}
                    <div className="flex items-center gap-3 ml-3">
                      {isLinked && (
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isMarkedForUnlink}
                            onChange={(e) =>
                              setUnlinkPreview((prev) => ({
                                ...prev,
                                [acc.accountId!]: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 accent-destructive"
                          />
                          <span className="text-xs text-muted-foreground">
                            {isMarkedForUnlink ? "To Unlink" : "Linked"}
                          </span>
                        </label>
                      )}

                      {isNew && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeAccount(acc.accountId!)}
                          className="h-8 w-8 p-0"
                          title="Remove from selection"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <Users className="w-12 h-12 opacity-15 mb-3" />
              <p className="text-sm font-medium">No accounts selected</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
