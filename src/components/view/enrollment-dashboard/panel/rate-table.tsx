import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calculator, CheckSquare, Info, MousePointer2 } from "lucide-react";
import { getMembershipsByMember } from "@/api/member.api";
import type { Response } from "@/types/response";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FamilyPanelProps {
  rateTableData: any[];
  NoOfDays: number;
  memberId: number;
  setSelectedRate: (data: any) => void;
}

export default function RateTable({ rateTableData, NoOfDays, memberId, setSelectedRate }: FamilyPanelProps) {
  const [activeMemberships, setActiveMemberships] = useState<any[]>([]);
  const [currentSelectedRow, setCurrentSelectedRow] = useState<string | null>(null);

  // 1. Get unique units and sort
  const sortedUnits = useMemo(() => {
    if (!rateTableData || !Array.isArray(rateTableData)) return [];
    const units = Array.from(new Set(rateTableData.map((item) => item.aboveUnits)));
    return (units as number[]).sort((a, b) => a - b);
  }, [rateTableData]);

  // 2. Group data: Now storing the WHOLE object under each unit tier
  const groupedData = useMemo(() => {
    if (!rateTableData || !Array.isArray(rateTableData)) return {};
    return rateTableData.reduce((acc: any, item) => {
      if (!acc[item.membershipType]) {
        acc[item.membershipType] = {
          fullDataByTier: {}, // This stores the whole object per unit tier
          masterId: item.membershipMasterId
        };
      }
      acc[item.membershipType].fullDataByTier[item.aboveUnits] = item;
      return acc;
    }, {});
  }, [rateTableData]);

  /**
   * Finds the nearest lower tier and returns the FULL object
   */
  const getCalculatedData = (membership: string) => {
    const membershipObj = groupedData[membership];
    if (!membershipObj) return { selectedObject: null, total: 0 };

    const dataTiers = membershipObj.fullDataByTier;
    const availableTiers = Object.keys(dataTiers).map(Number).sort((a, b) => a - b);

    // Find nearest lower/equal tier
    const bestTier = availableTiers.filter((tier) => tier <= NoOfDays).reverse()[0];
    const selectedObject = bestTier !== undefined ? dataTiers[bestTier] : null;

    return {
      selectedObject,
      total: NoOfDays * (selectedObject?.unitRate || 0)
    };
  };

  /**
   * Handles user selection - Passing the whole data object back
   */
  const handleSelectRate = (membership: string) => {
    const { selectedObject } = getCalculatedData(membership);
    if (selectedObject) {
      setCurrentSelectedRow(membership);
      setSelectedRate(selectedObject);

      toast({
        title: "Membership Selected",
        description: `Full data for ${membership} captured.`,
        duration: 2000,
      });
    }
  };

  const fetchMembershipsByMember = async () => {
    try {
      const res: Response<any> = await getMembershipsByMember(Number(memberId));
      const data = res.data || [];
      setActiveMemberships(data);

      // Auto-select logic using the whole object
      if (data.length > 0) {
        Object.keys(groupedData).forEach(membership => {
          if (data.some((m: any) => m.membershipMasterId === groupedData[membership].masterId)) {
            handleSelectRate(membership);
          }
        });
      }
    } catch {
      toast({ title: "Error", description: "Fetch failed", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (memberId) fetchMembershipsByMember();
  }, [memberId, rateTableData]);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden p-2">
      {/* Excel Style Header */}
      <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-2 px-1">
        <div className="flex items-center gap-3">
          <div className="bg-green-700 p-1.5 rounded">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">
            Pricing Calculation Sheet
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase">
          <MousePointer2 className="h-3 w-3" /> Click Total to Select Full Data
        </div>
      </div>

      {/* Main Excel Grid Container */}
      <div className="flex-1 overflow-auto border border-slate-300 rounded-sm bg-slate-50">
        <Table className="border-collapse">
          <TableHeader className="bg-slate-100 sticky top-0 z-40">
            <TableRow className="hover:bg-transparent border-b border-slate-300">
              <TableHead className="sticky left-0 z-50 bg-slate-200 border-r border-slate-300 text-slate-700 font-bold text-sm uppercase px-4 py-3 min-w-[220px]">
                Membership Category
              </TableHead>

              <TableHead className="sticky left-[220px] z-50 bg-blue-100 border-r border-slate-300 text-blue-900 font-bold text-sm text-center px-4 py-3 min-w-[160px]">
                Total Cost (₹)
              </TableHead>

              {sortedUnits.map((unit) => (
                <TableHead key={unit} className="border-r border-slate-300 text-slate-600 font-semibold text-xs text-center px-4 py-3 min-w-[110px]">
                  {unit}+ Units Rate
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {Object.keys(groupedData).map((membership, idx) => {
              const { selectedObject, total } = getCalculatedData(membership);
              const isMatchedMember = activeMemberships.some(m => m.membershipMasterId === groupedData[membership].masterId);
              const isCasual = membership.toLowerCase().includes("casual");
              const isHighlighted = isMatchedMember || isCasual;
              const isSelected = currentSelectedRow === membership;

              return (
                <TableRow
                  key={membership}
                  className={cn(
                    "border-b border-slate-200 transition-none",
                    isHighlighted ? "bg-yellow-50 hover:bg-yellow-100" : "bg-white hover:bg-slate-50"
                  )}
                >
                  {/* Membership Category */}
                  <TableCell className={cn(
                    "sticky left-0 z-10 border-r border-slate-300 font-bold text-base px-4 py-2",
                    isHighlighted ? "bg-yellow-100 text-yellow-900" : "bg-inherit text-slate-700"
                  )}>
                    <div className="flex items-center justify-between">
                      <span>{membership}</span>
                      {isMatchedMember && <CheckSquare className="h-4 w-4 text-green-700" />}
                    </div>
                  </TableCell>

                  {/* Total Cost - CLICKABLE to select WHOLE Object */}
                  <TableCell
                    onClick={() => handleSelectRate(membership)}
                    className={cn(
                      "sticky left-[220px] z-20 border-r border-slate-300 font-mono text-center px-4 py-2 text-lg font-black cursor-pointer",
                      isSelected
                        ? "bg-blue-600 text-white shadow-[inset_0_0_0_2px_#1e40af] scale-[1.01]"
                        : isHighlighted
                          ? "bg-yellow-200/50 text-yellow-950 hover:bg-yellow-200"
                          : "bg-blue-50/50 text-blue-800 hover:bg-blue-100"
                    )}
                  >
                    <div className="flex flex-col items-center">
                      ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      {/* {isSelected && <span className="text-[9px] font-bold bg-white text-blue-600 px-1 rounded mt-0.5">SELECTED</span>} */}
                    </div>
                  </TableCell>

                  {/* Unit Tier Grid */}
                  {sortedUnits.map((unit) => {
                    const item = groupedData[membership].fullDataByTier[unit];
                    const isAppliedTier = selectedObject?.aboveUnits === unit;

                    return (
                      <TableCell
                        key={unit}
                        className={cn(
                          "border-r border-slate-200 text-center font-mono text-base px-4 py-2",
                          isAppliedTier && (isSelected ? "bg-blue-100 text-blue-800 font-black" : "bg-green-50 text-green-700 font-bold")
                        )}
                      >
                        {item ? parseFloat(item.unitRate).toFixed(2) : <span className="text-slate-300">—</span>}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Excel Footer Legend */}
      <div className="mt-2 flex items-center justify-between px-2 py-1 bg-slate-100 border border-slate-300 rounded-sm text-[11px] font-medium text-slate-600">
        <div className="flex gap-4">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-600"></div><span>Selected for submission</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-100 border border-yellow-300"></div><span>Active Plan</span></div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-50 border border-green-300"></div><span>Nearest Tier Applied</span></div>
        </div>
        <div className="flex items-center gap-1">
          <Info className="h-3 w-3" />
          <span>Clicking **Total Cost** updates the form with full membership data details.</span>
        </div>
      </div>
    </div>
  );
}