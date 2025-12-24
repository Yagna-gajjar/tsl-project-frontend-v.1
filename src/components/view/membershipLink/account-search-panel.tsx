"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Account } from "@/types/account";
import { Search, Plus, Loader2, Check } from "lucide-react";

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
  searchAccount,
  addAccount,
  selectedAccounts,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
        <Search className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg text-foreground">Find Accounts</h3>
      </div>

      <div className="flex gap-2.5">
        <Input
          placeholder="Search by Name, Phone, or Email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchAccount()}
          className="flex-grow text-sm bg-background/50 border-border/50 placeholder:text-muted-foreground/60"
          disabled={isSearching}
        />
        <Button
          onClick={searchAccount}
          disabled={isSearching}
          className="font-semibold px-5 h-10"
          size="sm"
        >
          {isSearching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className="border border-border/40 rounded-lg bg-background/30 shadow-sm h-80 transition-all duration-200 hover:border-border/60 hover:shadow-md overflow-hidden">
        <ScrollArea className="h-full">
          {results.length > 0 ? (
            <div className="divide-y divide-border/30">
              {results.map((acc) => {
                // Check if account is already in the selected list
                const isSelected = selectedAccounts.some(
                  (a) => a.accountId === acc.accountId
                );

                if (isSelected) return

                return (
                  <div
                    key={acc.accountId}
                    className="flex justify-between items-center p-3.5 hover:bg-accent/40 transition-colors group"
                  >
                    <div className="text-sm space-y-1 flex-1">
                      <span className="font-semibold text-foreground block group-hover:text-primary transition-colors">
                        {acc.accountName}
                      </span>
                      {acc.contact && (
                        <span className="text-muted-foreground text-xs">
                          {acc.contact}
                        </span>
                      )}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => !isSelected && addAccount(acc)}
                      variant={isSelected ? "secondary" : "default"}
                      disabled={isSelected}
                      className="h-8 text-xs px-3 ml-3 whitespace-nowrap"
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : isSearching ? (
            <div className="p-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Searching accounts...
              </p>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Type to search for accounts
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
