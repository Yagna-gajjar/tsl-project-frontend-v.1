// selected-accounts-panel.tsx
"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { Account } from "@/types/account";
import { X, Link2, Unlink, PlusCircle } from "lucide-react";
import React from "react";

type AccountWithLinkData = Account & {
  linkDate?: string;
  dLinkDate?: string | null;
  isExisting?: boolean;
  accountId?: number;
  membershipLinkId?: number;
};

type UnlinkPreviewItem = {
  membershipLinkId: number;
  dLinkDate: string | null;
};

type Props = {
  selectedAccounts: AccountWithLinkData[];
  removeAccount: (id: number) => void;
  unlinkPreview: UnlinkPreviewItem[];
  setUnlinkPreview: React.Dispatch<
    React.SetStateAction<UnlinkPreviewItem[]>
  >;
  memberLimit: number;
};

export default function SelectedAccountsPanel({
  selectedAccounts,
  removeAccount,
  unlinkPreview = [],
  setUnlinkPreview,
  memberLimit,
}: Props) {
  const renderColumn = (
    title: string,
    icon: React.ReactNode,
    filterFn: (acc: AccountWithLinkData) => boolean,
    headerColor: string,
    showCheckbox: boolean = false
  ) => {
    const items = selectedAccounts.filter(filterFn);

    return (
      <div className="flex flex-col h-full border-r last:border-r-0 border-border/40">
        <div
          className={`flex items-center gap-2 p-2 border-b bg-muted/20 ${headerColor}`}
        >
          {icon}
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {title}
          </span>
          <span className="ml-auto bg-background/50 px-1.5 py-0.5 rounded text-[9px] font-mono">
            {items.length}
          </span>
        </div>

        <ScrollArea className="flex-1">
          <div className="divide-y divide-border/10">
            {items.map((acc) => {
              const isNew = !acc.isExisting;

              // ✅ CORRECT unlink check (array-based)
              const isMarkedForUnlink =
                unlinkPreview.some(
                  (u) => u.membershipLinkId === acc.membershipLinkId
                ) || !!acc.dLinkDate;

              return (
                <div
                  key={acc.accountId}
                  className={`group flex items-center justify-between p-2 transition-colors ${
                    isMarkedForUnlink
                      ? "bg-orange-50/40 opacity-80"
                      : "hover:bg-accent/30"
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-semibold truncate leading-tight">
                      {acc.accountName}
                    </span>
                    {acc.linkDate && (
                      <span className="text-[9px] text-muted-foreground">
                        {new Date(acc.linkDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {showCheckbox && acc.membershipLinkId && (
                      <input
                        type="checkbox"
                        checked={isMarkedForUnlink}
                        onChange={() =>
                          setUnlinkPreview((prev = []) => {
                            const exists = prev.some(
                              (item) =>
                                item.membershipLinkId ===
                                acc.membershipLinkId
                            );

                            // TOGGLE OFF
                            if (exists) {
                              return prev.filter(
                                (item) =>
                                  item.membershipLinkId !==
                                  acc.membershipLinkId
                              );
                            }

                            // TOGGLE ON
                            return [
                              ...prev,
                              {
                                membershipLinkId: acc.membershipLinkId!,
                                dLinkDate: new Date().toISOString(),
                              },
                            ];
                          })
                        }
                        className="h-3.5 w-3.5 accent-destructive cursor-pointer"
                      />
                    )}

                    {isNew && (
                      <button
                        onClick={() => removeAccount(acc.accountId!)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  };

  const activeLinkedCount = selectedAccounts.filter(
    (acc) => acc.isExisting && !acc.dLinkDate
  ).length;

  const inactiveLinkedCount = selectedAccounts.filter(
    (acc) => acc.isExisting && acc.dLinkDate
  ).length;

  return (
    <div className="space-y-2">
      {Number(memberLimit) > 0 && (
        <div className="flex items-center w-full justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground">Accounts</h2>
            <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/10 px-2 py-0.5 rounded text-xs font-semibold text-primary">
              Limit:{" "}
              {selectedAccounts.length -
                inactiveLinkedCount -
                unlinkPreview.length}
              /{memberLimit}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium">
                {activeLinkedCount -
                  unlinkPreview.length}{" "}
                Linked
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
                {inactiveLinkedCount + unlinkPreview.length} De-linked
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="border rounded-md bg-background/40 shadow-sm overflow-auto h-72">
        <div className="grid grid-cols-3 h-full divide-x divide-border/40">
          {renderColumn(
            "New",
            <PlusCircle className="w-3 h-3 text-blue-500" />,
            (a) => !a.isExisting,
            "text-blue-600"
          )}
          {renderColumn(
            "Active",
            <Link2 className="w-3 h-3 text-emerald-500" />,
            (a) => !!a.isExisting && !a.dLinkDate,
            "text-emerald-600",
            true
          )}
          {renderColumn(
            "History",
            <Unlink className="w-3 h-3 text-slate-400" />,
            (a) => !!a.isExisting && !!a.dLinkDate,
            "text-slate-500"
          )}
        </div>
      </div>
    </div>
  );
}
