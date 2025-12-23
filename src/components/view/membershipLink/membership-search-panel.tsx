"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { membership } from "@/types/membership";
import { Search, Plus, Loader2 } from "lucide-react";

type Props = {
  search: string;
  setSearch: (value: string) => void;
  results: membership[];
  isSearching: boolean;
  searchMembership: () => Promise<void>;
  addMembership: (membership: membership) => void;
  selectedMemberships: membership[];
};

export default function MembershipSearchPanel({
  search,
  setSearch,
  results,
  isSearching,
  searchMembership,
  addMembership,
  selectedMemberships,
}: Props) {
  return (
    <div className="space-y-4">
      <h3 className="font-extrabold text-xl text-primary border-b pb-2 tracking-wide">
        <span className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Find Memberships
        </span>
      </h3>

      <div className="flex gap-2">
        <Input
          placeholder="Search by Membership Name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchMembership()}
          className="flex-grow text-base p-2.5"
          disabled={isSearching}
        />
        <Button
          onClick={searchMembership}
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
            results.map((membership) => (
              <div
                key={membership.membershipId}
                className="flex justify-between items-center p-3 border-b border-border/50 last:border-b-0 hover:bg-accent/50 transition-colors"
              >
                <div className="text-sm">
                  <span className="font-semibold text-foreground block">
                    {membership.accountName}
                  </span>
                  <span className="text-muted-foreground text-xs">{`ID: ${membership.membershipId}`}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => addMembership(membership)}
                  variant={
                    selectedMemberships.some(
                      (m) => m.membershipId === membership.membershipId
                    )
                      ? "secondary"
                      : "default"
                  }
                  disabled={selectedMemberships.some(
                    (m) => m.membershipId === membership.membershipId
                  )}
                  className="h-8 text-sm"
                >
                  {selectedMemberships.some(
                    (m) => m.membershipId === membership.membershipId
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
              Start typing and click search to find memberships to link.
            </p>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
