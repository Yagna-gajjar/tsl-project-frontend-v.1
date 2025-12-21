"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreditCard, Trash2 } from "lucide-react";
import type { Membership } from "./membership-link-form-modal";

type Props = {
  selectedMemberships: Membership[];
  removeMembership: (id: number) => void;
};

export default function SelectedMembershipsPanel({
  selectedMemberships,
  removeMembership,
}: Props) {
  return (
    <div className="space-y-4">
      <h3 className="font-extrabold text-xl text-primary border-b pb-2 tracking-wide">
        <span className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Selected Memberships ({selectedMemberships.length})
        </span>
      </h3>

      <div className="border border-border/70 rounded-lg bg-background shadow-inner h-80 transition-shadow duration-300">
        <ScrollArea className="h-full">
          {selectedMemberships.length > 0 ? (
            selectedMemberships.map((membership) => (
              <div
                key={membership.membershipId}
                className="flex justify-between items-center p-3 border-b border-primary/20 last:border-b-0 bg-secondary/10"
              >
                <div className="text-sm">
                  <span className="font-semibold text-foreground block">
                    {membership.name}
                  </span>
                  <span className="text-muted-foreground text-xs">{`ID: ${membership.membershipId}`}</span>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeMembership(membership.membershipId)}
                  className="h-8 w-8 p-0"
                  title={`Remove ${membership.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="p-4 text-center text-base text-muted-foreground pt-12">
              Memberships added will appear here.
            </p>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
