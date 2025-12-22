"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Account } from "@/types/account";
import { Search, Plus, Loader2 } from "lucide-react";

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
      <h3 className="font-extrabold text-xl text-primary border-b pb-2 tracking-wide">
        <span className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Find Accounts
        </span>
      </h3>

      <div className="flex gap-2">
        <Input
          placeholder="Search by Name, Phone, or Email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchAccount()}
          className="flex-grow text-base p-2.5"
          disabled={isSearching}
        />
        <Button
          onClick={searchAccount}
          disabled={isSearching}
          className="font-semibold px-4"
        >
          {isSearching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Search
        </Button>
      </div>

      <div className="border border-border/70 rounded-lg bg-background shadow-inner h-80 transition-shadow duration-300">
        <ScrollArea className="h-full">
          {results.length > 0 ? (
            results.map((acc) => (
              <div
                key={acc.accountId}
                className="flex justify-between items-center p-3 border-b border-border/50 last:border-b-0 hover:bg-accent/50 transition-colors"
              >
                <div className="text-sm">
                  <span className="font-semibold text-foreground block">
                    {acc.accountName}
                  </span>
                  {acc.contact && (
                    <span className="text-muted-foreground text-xs">{`Phone: ${acc.contact}`}</span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => addAccount(acc)}
                  variant={
                    selectedAccounts.some((a) => a.accountId === acc.accountId)
                      ? "secondary"
                      : "default"
                  }
                  disabled={selectedAccounts.some(
                    (a) => a.accountId === acc.accountId
                  )}
                  className="h-8 text-sm"
                >
                  {selectedAccounts.some(
                    (a) => a.accountId === acc.accountId
                  ) ? (
                    "Added"
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))
          ) : isSearching ? (
            <p className="p-4 text-center font-medium text-sm text-primary/70">
              <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
              Searching...
            </p>
          ) : (
            <p className="p-4 text-center text-base text-muted-foreground pt-12">
              Start typing and click search to find accounts to link.
            </p>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
