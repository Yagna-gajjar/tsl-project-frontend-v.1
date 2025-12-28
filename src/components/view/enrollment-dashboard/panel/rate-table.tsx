import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calculator, CheckSquare, Info, MousePointer2 } from "lucide-react";
import { getMembershipsByMember } from "@/api/member.api";
import type { Response } from "@/types/response";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getEnumsByCategory } from "@/api/enums.api";
import type { Enums } from "@/types/enums";

interface FamilyPanelProps {
  rateTableData: any[];
  NoOfDays: number;
  memberId: number;
  setSelectedRate: (data: any) => void;
  actualDaysInWeek: number;
  selectedCourseDayInWeek: number;
}

export default function RateTable({
  rateTableData,
  NoOfDays,
  memberId,
  setSelectedRate,
  actualDaysInWeek,
  selectedCourseDayInWeek,
}: FamilyPanelProps) {
  const [activeMemberships, setActiveMemberships] = useState<any[]>([]);
  const [currentSelectedRow, setCurrentSelectedRow] = useState<string | null>(null);
  const [walkingAccount, setWalkingAccount] = useState<number>();
  const [casualAccount, setCasualAccount] = useState<number>();

  const getAccountForMembership = (membershipMasterId: number) => {
    return activeMemberships.find(
      (m: any) => m.membershipMasterId === membershipMasterId
    );
  };


  const formatDec = (num: number) => {
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const sortedUnits = useMemo(() => {
    if (!rateTableData || !Array.isArray(rateTableData)) return [];
    const units = Array.from(new Set(rateTableData.map((item) => item.aboveUnits)));
    return (units as number[]).sort((a, b) => a - b);
  }, [rateTableData]);

  const groupedData = useMemo(() => {
    if (!rateTableData || !Array.isArray(rateTableData)) return {};
    return rateTableData.reduce((acc: any, item) => {
      if (!acc[item.membershipType]) {
        acc[item.membershipType] = {
          fullDataByTier: {},
          masterId: item.membershipMasterId,
        };
      }
      acc[item.membershipType].fullDataByTier[item.aboveUnits] = item;
      return acc;
    }, {});
  }, [rateTableData]);

  const getDiscountFactor = (rateDaysInWeek: number, disc: number) => {
    const finalDaysInWeek = Math.max(rateDaysInWeek || 0, actualDaysInWeek || 0);
    const factor = 1 - (selectedCourseDayInWeek - finalDaysInWeek) * (disc / 100);
    return factor;
  };

  const getCalculatedData = (membership: string) => {
    const membershipObj = groupedData[membership];
    if (!membershipObj) return { selectedObject: null, total: 0 };

    const dataTiers = membershipObj.fullDataByTier;
    const availableTiers = Object.keys(dataTiers).map(Number).sort((a, b) => a - b);

    const bestTier = availableTiers.filter((tier) => tier <= NoOfDays).reverse()[0];
    const rawObject = bestTier !== undefined ? dataTiers[bestTier] : null;
    if (!rawObject) return { selectedObject: null, total: 0 };

    const factor = getDiscountFactor(rawObject.minDaysInEnr, rawObject.discountOnDayReduce);
    const displayedUnitRate = parseFloat((parseFloat(rawObject.unitRate) * factor).toFixed(2));
    const total = NoOfDays * displayedUnitRate;
    const matchedAccount = getAccountForMembership(membershipObj.masterId);

    const membershipTypeLower = rawObject.membershipType.toLowerCase();

    let accountId: number | null = matchedAccount?.accountId ?? null;
    let accountName: string | null = matchedAccount?.accountName ?? null;
    let membershipId: number | null = matchedAccount?.membershipId ?? null;

    if (membershipTypeLower.includes("casual")) {
      accountId = casualAccount ?? null;
      accountName = "Casual Account";
      membershipId = null;
    }

    if (membershipTypeLower.includes("walk in")) {
      accountId = walkingAccount ?? null;
      accountName = "Walk-in Account";
      membershipId = null;
    }

    const selectedObject = {
      ...rawObject,
      patternDiscount: factor,
      accountId,
      accountName,
      membershipId,
    };

    return { selectedObject, total };
  };

  const handleSelectRate = (membership: string) => {
    const { selectedObject } = getCalculatedData(membership);
    if (selectedObject) {
      setCurrentSelectedRow(membership);
      setSelectedRate(selectedObject);
      toast({
        title: "Rate Selected",
        description: `₹${formatDec(selectedObject.unitRate)} / unit applied.`,
        duration: 2000,
      });
    }
  };

  const fetchMembershipsByMember = async () => {
    if (!memberId) return;
    try {
      const res: Response<any> = await getMembershipsByMember(Number(memberId));
      const data = res.data || [];
      setActiveMemberships(data);

      if (data.length > 0) {
        Object.keys(groupedData).forEach((membership) => {
          if (data.some((m: any) => m.membershipMasterId === groupedData[membership].masterId)) {
            handleSelectRate(membership);
          }
        });
      }
    } catch {
      toast({ title: "Error", description: "Membership check failed", variant: "destructive" });
    }
  };

  const fetchCasualAndWalkingAccounts = async () => {
    try {
      const [casualRes, walkingRes]: [
        Response<Enums[]>,
        Response<Enums[]>
      ] = await Promise.all([
        getEnumsByCategory("casual_account"),
        getEnumsByCategory("walking_account"),
      ]);
      if (casualRes.success && casualRes.data) {
        setCasualAccount(Number(casualRes?.data[0].value));
      }

      if (walkingRes.success && walkingRes.data) {
        setWalkingAccount(Number(walkingRes?.data[0].value));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch casual & walk-in accounts.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchMembershipsByMember();
  }, [memberId, rateTableData]);

  useEffect(() => {
    fetchCasualAndWalkingAccounts()
  }, []);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden p-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-800 pb-2 mb-2 px-1 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-green-700 dark:bg-green-600 p-1.5 rounded">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">
            Pricing Calculation Sheet
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
          <MousePointer2 className="h-3 w-3" /> Click Total Cost to Select Rate
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto border border-slate-300 dark:border-slate-800 rounded-sm bg-slate-50 dark:bg-slate-950 relative">
        <Table className="border-separate border-spacing-0 min-w-full">
          <TableHeader className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 top-0 z-50 bg-slate-200 dark:bg-slate-800 border-r border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm uppercase px-4 py-3 min-w-[220px]">
                Membership Category
              </TableHead>

              <TableHead className="sticky left-[220px] top-0 z-50 bg-blue-100 dark:bg-blue-950 border-r border-b border-slate-300 dark:border-slate-700 text-blue-900 dark:text-blue-200 font-bold text-sm text-center px-4 py-3 min-w-[160px]">
                Total Cost (₹)
              </TableHead>

              {sortedUnits.map((unit) => (
                <TableHead key={unit} className="border-r border-b border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-xs text-center px-4 py-3 min-w-[110px] whitespace-nowrap">
                  {unit}+ Units Rate
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {Object.keys(groupedData).map((membership) => {
              const { selectedObject, total } = getCalculatedData(membership);
              const isMatchedMember = activeMemberships.some(m => m.membershipMasterId === groupedData[membership].masterId);
              const isCasual = membership.toLowerCase().includes("casual");
              const isWalkin = membership.toLowerCase().includes("walk in");
              const isHighlighted = isMatchedMember || isCasual || isWalkin;
              const isSelected = currentSelectedRow === membership;

              return (
                <TableRow
                  key={membership}
                  className={cn(
                    "transition-none",
                    isHighlighted
                      ? "bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                      : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900"
                  )}
                >
                  {/* Category Column */}
                  <TableCell className={cn(
                    "sticky left-0 z-10 border-r border-b border-slate-300 dark:border-slate-800 font-bold text-base px-4 py-2",
                    isHighlighted
                      ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-100"
                      : "bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col justify-center">
                        <span className="truncate mr-1">{membership}</span>
                        {isMatchedMember && (
                          <span className="text-xs text-slate-500 block">
                            {getAccountForMembership(groupedData[membership].masterId)?.accountName}
                          </span>
                        )}
                      </div>
                      {isMatchedMember && <CheckSquare className="h-4 w-4 text-green-700 dark:text-green-500 shrink-0" />}
                    </div>
                  </TableCell>

                  {/* Total Cost Column */}
                  <TableCell
                    onClick={() => handleSelectRate(membership)}
                    className={cn(
                      "sticky left-[220px] z-20 border-r border-b border-slate-300 dark:border-slate-800 font-mono text-center px-4 py-2 text-lg font-black cursor-pointer",
                      isSelected
                        ? "bg-blue-600 dark:bg-blue-500 text-white"
                        : isHighlighted
                          ? "bg-yellow-200/50 dark:bg-yellow-800/40 text-yellow-950 dark:text-yellow-50 hover:bg-yellow-200 dark:hover:bg-yellow-800/60"
                          : "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60"
                    )}
                  >
                    ₹{formatDec(total)}
                  </TableCell>

                  {/* Tier Units Columns */}
                  {sortedUnits.map((unit) => {
                    const item = groupedData[membership].fullDataByTier[unit];
                    const isAppliedTier = selectedObject?.aboveUnits === unit;

                    return (
                      <TableCell
                        key={unit}
                        className={cn(
                          "border-r border-b border-slate-200 dark:border-slate-800 text-center font-mono text-base px-4 py-2 whitespace-nowrap",
                          isAppliedTier && (
                            isSelected
                              ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 font-black"
                              : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold"
                          )
                        )}
                      >
                        {item ? (() => {
                          const factor = getDiscountFactor(item.minDaysInEnr, item.discountOnDayReduce);
                          const baseRate = parseFloat(item.unitRate);
                          const discountedRate = baseRate * factor;

                          if (factor === 1) return baseRate.toFixed(2);

                          return (
                            <span className="flex items-center justify-center gap-1.5">
                              <span className="line-through text-slate-400 dark:text-slate-500 text-xs">
                                {baseRate.toFixed(2)}
                              </span>
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                {discountedRate.toFixed(2)}
                              </span>
                            </span>
                          );
                        })() : (
                          <span className="text-slate-300 dark:text-slate-700">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Legend Footer */}
      <div className="mt-2 flex items-center justify-between px-2 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-sm text-[11px] font-medium text-slate-600 dark:text-slate-400 shrink-0">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-600 dark:bg-blue-500"></div><span>Selected for Submission</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700"></div><span>Active / Casual Plan</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800"></div><span>Tier Logic Active</span></div>
        </div>
        <div className="flex items-center gap-1">
          <Info className="h-3 w-3" />
          <span>Calculations include Pattern Discounts (2 decimals).</span>
        </div>
      </div>
    </div>
  );
}