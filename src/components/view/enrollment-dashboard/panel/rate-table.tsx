import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Coins, Users, Info, Layers } from "lucide-react";

interface FamilyPanelProps {
  rateTableData: any[];
}

export default function RateTable({ rateTableData }: FamilyPanelProps) {
  const sortedUnits = useMemo(() => {
    if (!rateTableData || !Array.isArray(rateTableData)) return [];
    const units = Array.from(new Set(rateTableData.map((item) => item.aboveUnits)));
    return units.sort((a, b) => a - b);
  }, [rateTableData]);

  const groupedData = useMemo(() => {
    if (!rateTableData || !Array.isArray(rateTableData)) return {};
    return rateTableData.reduce((acc: any, item) => {
      if (!acc[item.membershipType]) acc[item.membershipType] = {};
      acc[item.membershipType][item.aboveUnits] = item.unitRate;
      return acc;
    }, {});
  }, [rateTableData]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20 overflow-y-auto scrollbar-none p-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-6"
      >
        {/* Header Section */}
        <div className="flex items-center justify-between px-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg shadow-blue-200 shadow-lg">
                <Coins className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-sm font-bold tracking-tight text-foreground">Unit Pricing Matrix</h3>
            </div>
            <p className="text-[10px] text-muted-foreground ml-9 uppercase tracking-widest font-medium">
              Tiered Rate Configuration
            </p>
          </div>
          {rateTableData?.length > 0 && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-2 py-0">
              {rateTableData.length} Entries
            </Badge>
          )}
        </div>

        {/* Table Container */}
        <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-md shadow-xl shadow-blue-900/5">
          {rateTableData && rateTableData.length > 0 ? (
            <div className="overflow-x-auto relative">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-b border-border/50">
                    {/* Sticky Column Header */}
                    <TableHead className="sticky left-0 z-20 bg-muted/80 backdrop-blur-md min-w-[160px] text-[10px] font-bold uppercase tracking-tighter py-4 px-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" /> MEMBERSHIP TYPE
                      </div>
                    </TableHead>
                    {sortedUnits.map((unit) => (
                      <TableHead key={unit} className="text-[10px] font-bold text-center px-6 text-muted-foreground min-w-[100px]">
                        {unit}+ UNITS
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(groupedData).map((membership, idx) => (
                    <TableRow
                      key={membership}
                      className={`group transition-colors ${idx % 2 === 0 ? 'bg-background/40' : 'bg-muted/20'} hover:bg-blue-50/50`}
                    >
                      {/* Sticky Membership Column */}
                      <TableCell className="sticky left-0 z-10 bg-inherit font-bold text-[11px] py-4 px-4 border-r border-border/30 text-foreground group-hover:text-blue-700 transition-colors">
                        {membership}
                      </TableCell>

                      {sortedUnits.map((unit) => (
                        <TableCell key={unit} className="text-center px-4 py-4">
                          {groupedData[membership][unit] ? (
                            <div className="inline-flex flex-col">
                              <span className="text-[12px] font-mono font-bold text-blue-600 bg-blue-100/50 px-2 py-1 rounded-md border border-blue-200/50">
                                <span className="text-[10px] mr-0.5 opacity-70 font-sans">₹</span>
                                {parseFloat(groupedData[membership][unit]).toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/30 font-light">—</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center bg-muted/5 border-2 border-dashed border-border/40 m-3 rounded-xl">
              <div className="p-4 bg-muted/20 rounded-full mb-4">
                <Layers className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground">No Pricing Matrix Loaded</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Select an active course to view rates</p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {rateTableData?.length > 0 && (
          <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20 overflow-y-auto p-5">
            <Info className="h-3 w-3" />
            <span className="text-[10px]">All rates are exclusive of applicable taxes unless specified.</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}