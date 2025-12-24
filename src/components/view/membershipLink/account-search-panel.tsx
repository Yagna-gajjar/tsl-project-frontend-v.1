// account-search-panel.tsx
"use client";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Account } from "@/types/account";
import { Search, Loader2, Plus } from "lucide-react";

type Props = {
  search: string;
  setSearch: (value: string) => void;
  results: Account[];
  isSearching: boolean;
  searchAccount: () => Promise<void>;
  addAccount: (acc: Account) => void;
  selectedAccounts: Account[];
};

export default function AccountSearchPanel({
  search,
  setSearch,
  results,
  isSearching,
  addAccount,
  selectedAccounts,
}: Props) {
  // Handle keyboard events for the badges
  const handleKeyDown = (e: React.KeyboardEvent, acc: Account) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault(); // Prevent page scroll on space
      addAccount(acc);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b pb-2">
        <Search className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Find Accounts</h3>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/50" />
        <Input
          placeholder="Search & Tab to select..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm bg-background/50 focus-visible:ring-1"
          disabled={isSearching}
        />
      </div>

      <div className="border rounded-md bg-background/20 h-[280px]">
        <ScrollArea className="h-full p-2">
          {isSearching ? (
            <div className="flex items-center justify-center h-full py-10">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {results.map((acc) => {
                const isSelected = selectedAccounts.some((a) => a.accountId === acc.accountId);
                if (isSelected) return null;

                return (
                  <button
                    key={acc.accountId}
                    type="button"
                    onClick={() => addAccount(acc)}
                    onKeyDown={(e) => handleKeyDown(e, acc)}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium transition-all 
                             bg-secondary text-secondary-foreground rounded-full border border-border/50
                             hover:bg-primary hover:text-primary-foreground 
                             focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                  >
                    <Plus className="w-3 h-3" />
                    {acc.accountName}
                  </button>
                );
              })}
              {results.length === 0 && !isSearching && (
                <p className="text-[11px] text-muted-foreground w-full text-center py-10">
                  No accounts found
                </p>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}