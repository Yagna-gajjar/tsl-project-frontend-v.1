import { motion } from "framer-motion";
import { TableProperties, Info } from "lucide-react";
import { Label } from "@/components/ui/label";

interface FamilyPanelProps {
  rateTableData: any;
}

export default function FamilyPanel({ rateTableData }: FamilyPanelProps) {
  return (
    <div className="flex flex-col h-full bg-card/30 backdrop-blur-sm p-5 border-r border-border/40 overflow-y-auto">
      <div className="mb-8 shrink-0">
        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <TableProperties className="h-4 w-4" />
          </div>
          Rate Configuration
        </h2>
        <p className="text-[11px] text-muted-foreground mt-1 ml-10">
          Viewing active calculation table
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        <div className="space-y-3">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2 ml-1">
            <Info className="h-3.5 w-3.5" /> Data Payload
          </Label>

          <div className="rounded-xl bg-muted/30 border border-border/40 p-4 shadow-inner">
            {rateTableData ? (
              <pre className="text-[11px] font-mono leading-relaxed text-primary/90 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(rateTableData, null, 2)}
              </pre>
            ) : (
              <div className="py-10 flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-lg">
                <p className="text-xs text-muted-foreground italic">
                  No rate data found
                </p>
                <span className="text-[10px] text-muted-foreground/60 mt-1">
                  Waiting for Enrollment Panel input...
                </span>
              </div>
            )}
          </div>
        </div>

        {rateTableData && (
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-[10px] text-primary font-medium uppercase tracking-wider">
              Status: Table Loaded Successfully
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}