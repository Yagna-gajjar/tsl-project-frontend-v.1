import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Account } from "@/types/account";
import { Users, Trash2 } from "lucide-react";

type Props = {
  selectedAccounts: Account[];
  removeAccount: (id: number) => void;
};

export default function SelectedAccountsPanel({
  selectedAccounts,
  removeAccount,
}: Props) {
  return (
    <div className="space-y-4">
      <h3 className="font-extrabold text-xl text-primary border-b pb-2 tracking-wide">
        <span className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Selected Family ({selectedAccounts.length})
        </span>
      </h3>

      <div className="border border-border/70 rounded-lg bg-background shadow-inner h-80 transition-shadow duration-300">
        <ScrollArea className="h-full">
          {selectedAccounts.length > 0 ? (
            selectedAccounts.map((acc) => (
              <div
                key={acc.accountId}
                className="flex justify-between items-center p-3 border-b border-primary/20 last:border-b-0 bg-secondary/10"
              >
                <div className="text-sm">
                  <span className="font-semibold text-foreground block">
                    {acc.accountName}
                  </span>
                  <span className="text-muted-foreground text-xs">{`ID: ${acc.accountId}`}</span>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeAccount(acc?.accountId as any)}
                  className="h-8 w-8 p-0"
                  title={`Remove ${acc.accountName}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="p-4 text-center text-base text-muted-foreground pt-12">
              Accounts added will appear here.
            </p>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
