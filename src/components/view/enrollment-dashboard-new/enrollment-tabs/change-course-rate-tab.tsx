import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import {
  CheckCircle2, Loader2,
  Calendar as CalendarIcon, Clock, Users as UsersIcon, Lock,
  IndianRupee
} from "lucide-react"
import { format, addDays, isAfter, parseISO, startOfToday } from "date-fns"

import { getCourseRates } from "@/api/courseRate.api"
import { getMembershipsByMember } from "@/api/member.api"
import type { Enrollment as EnrollmentData } from "@/types/enrollment"
import type { CourseRate } from "@/types/courseRate"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Card } from "@/components/ui/card"
import { getEnumsByCategory } from "@/api/enums.api"

const WEEK_DAYS = [
  { label: "Mon", value: "1" },
  { label: "Tue", value: "2" },
  { label: "Wed", value: "3" },
  { label: "Thu", value: "4" },
  { label: "Fri", value: "5" },
  { label: "Sat", value: "6" },
  { label: "Sun", value: "7" },
];

interface CourseRateTabProps {
  balance: number
  data?: EnrollmentData
  onUpdate: (data: Partial<EnrollmentData>) => void
}

export function ChangeCourseRateTab({ balance, data, onUpdate }: CourseRateTabProps) {
  const activeCourse = data?.course;
  const allowedPattern = activeCourse?.daysPattern || "1234567";

  const [rates, setRates] = useState<CourseRate[]>([])

  const finalBalance = balance / (1 + ((Number(data?.course?.cgstRate) + Number(data?.course?.sgstRate)) / 100));
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRate, setSelectedRate] = useState<CourseRate | null>(data?.courseRate || null)

  const [billingDaysSessions, _] = useState(data?.billingDaysSessions || 1)
  const [startDate, setStartDate] = useState<Date>(data?.attendingStartDate ? parseISO(data.attendingStartDate) : startOfToday())
  const [endDate, setEndDate] = useState<string>(data?.endDate || "")
  const [startTime, setStartTime] = useState(data?.startTime || (activeCourse?.avbFrom?.slice(0, 5) || "09:00"))
  const [membersEnrolled, setMembersEnrolled] = useState(data?.membersEnrolled || 1)
  const [membershipData, setMembershipData] = useState<any[]>([]);

  const [selectedDays, setSelectedDays] = useState<string[]>(
    data?.attendingPattern ? String(data.attendingPattern).split("") : allowedPattern.split("")
  )
  const [casualAccount, setCasualAccount] = useState<number | null>(null);
  const [walkingAccount, setWalkingAccount] = useState<number | null>(null);

  const actualDaysInWeek = selectedDays.length;
  const selectedCourseDayInWeek = allowedPattern.length;

  const getDiscountFactor = (rateDaysInWeek: number, disc: number) => {
    const finalDaysInWeek = Math.max(rateDaysInWeek || 0, actualDaysInWeek || 0);
    return 1 - (selectedCourseDayInWeek - finalDaysInWeek) * (Number(disc) / 100);
  };

  const getAccountMapping = (category: string, membershipMasterId: number) => {
    const catLower = category.toLowerCase();
    const match = membershipData.find(m => m.membershipMasterId === membershipMasterId);
    if (match) return { accountId: match.accountId, accountName: match.accountName, membershipId: match.membershipId };
    if (catLower.includes("casual")) return { accountId: casualAccount, accountName: "Casual Account", membershipId: null };
    if (catLower.includes("walk in")) return { accountId: walkingAccount, accountName: "Walk-in Account", membershipId: null };

    return null;
  };

  useEffect(() => {
    if (activeCourse?.courseId) {
      setIsLoading(true)

      getCourseRates({ courseId: Number(activeCourse.courseId), limit: 1000 })
        .then(res => res?.data && setRates(res.data))
        .finally(() => setIsLoading(false));
    }
  }, [activeCourse?.courseId]);

  useEffect(() => {
    if (data?.member?.memberId) {
      getMembershipsByMember(data.member.memberId).then(res => setMembershipData(res.data || []));
      fetchCasualAndWalkingAccounts();
    }
  }, [data?.member?.memberId]);

  const fetchCasualAndWalkingAccounts = async () => {
    const [c, w] = await Promise.all([getEnumsByCategory("casual_account"), getEnumsByCategory("walking_account")]);
    if (c.success) setCasualAccount(Number(c.data?.[0].value));
    if (w.success) setWalkingAccount(Number(w.data?.[0].value));
  };

  useEffect(() => {
    if (!activeCourse) return;
    const pattern = activeCourse.chargingPattern?.toLowerCase();
    if (pattern === "unit" || pattern === "school") {
      const introDate = activeCourse.introduceDate ? parseISO(activeCourse.introduceDate as string) : startOfToday();
      setStartDate(isAfter(introDate, startOfToday()) ? introDate : startOfToday());
      if (activeCourse.suspensionDate) setEndDate(format(parseISO(activeCourse.suspensionDate as string), "yyyy-MM-dd"));
    } else {
      const mult = pattern === "session" ? (activeCourse.unitsMultipleOf || 1) : 1;
      setEndDate(format(addDays(startDate, (billingDaysSessions * mult) - 1), "yyyy-MM-dd"));
    }
  }, [activeCourse, startDate, billingDaysSessions]);

  const { sortedTiers, groupedData } = useMemo(() => {
    const tiers = Array.from(new Set(rates.map(r => Number(r.aboveUnits)))).sort((a, b) => a - b)
    const grouped = rates.reduce((acc: any, rate) => {
      const cat = rate.membershipType || "Standard"
      if (!acc[cat]) acc[cat] = { tiers: {}, masterId: rate.membershipMasterId };
      acc[cat].tiers[rate.aboveUnits] = rate;
      return acc
    }, {})
    return { sortedTiers: tiers, groupedData: grouped }
  }, [rates])

  const getApplicableRateForRow = (category: string) => {
    const row = groupedData[category];
    if (!row) return null;
    const targetTier = sortedTiers.filter(t => t <= billingDaysSessions).reverse()[0] || sortedTiers[0];
    if (row.tiers[targetTier]) return row.tiers[targetTier];
    const lower = Object.keys(row.tiers).map(Number).filter(t => t < targetTier).sort((a, b) => b - a);
    return lower.length > 0 ? row.tiers[lower[0]] : null;
  }

  const handleSelectRow = (category: string) => {
    const row = groupedData[category];
    const rawRate = getApplicableRateForRow(category);
    const mapping = getAccountMapping(category, row.masterId);

    if (!rawRate || !mapping) return;

    const factor = rawRate
      ? getDiscountFactor(rawRate.minDaysInEnr || 0, rawRate.discountOnDayReduce || 0)
      : 1;
    setSelectedRate(rawRate);
    const days = Math.floor(Number(finalBalance) / Number(rawRate.unitRate * factor));

    onUpdate({
      courseRate: rawRate,
      billingDaysSessions: days,
      attendingStartDate: format(startDate, "yyyy-MM-dd"),
      endDate,
      startTime,
      membersEnrolled: activeCourse?.chargingPattern?.toLowerCase() === "school" ? membersEnrolled : 1,
      attendingPattern: selectedDays.sort().join(""),
      attendingPatternDays: selectedDays.length,
      patternDiscount: factor,
      billingRate: Number(rawRate.unitRate) * factor,
      accountId: mapping.accountId,
      accountName: mapping.accountName,
      membershipId: mapping.membershipId,
      membershipMasterId: row.masterId,
      permittedDays: 0
      // permittedDays: (billingDaysSessions * Number(activeCourse?.unitsMultipleOf || 1))
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full space-y-4 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-xl border border-border">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1"><CalendarIcon size={12} /> Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-xs font-semibold h-10 bg-background border-border">
                {format(startDate, "dd MMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} disabled={(d) => d < startOfToday()} /></PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1"><Clock size={12} /> Time</Label>
          <Input type="time" className="h-10 text-xs" value={startTime} min={activeCourse?.avbFrom?.slice(0, 5)} max={activeCourse?.avbTo?.slice(0, 5)} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1"><IndianRupee size={12} /> Balance</Label>
          <Input type="number" className="h-10 text-xs font-mono" value={finalBalance} disabled />
        </div>
        {activeCourse?.chargingPattern?.toLowerCase() === "school" && <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1"><UsersIcon size={12} /> Members</Label>
          <Input type="number" className="h-10 text-xs" disabled={activeCourse?.chargingPattern?.toLowerCase() !== "school"} value={membersEnrolled} onChange={(e) => setMembersEnrolled(Number(e.target.value))} />
        </div>}
      </div>

      <Card className="p-4 border-2 border-primary/20 bg-primary/5">
        <ToggleGroup type="multiple" variant="outline" className="justify-start gap-2" value={selectedDays} onValueChange={(val) => val.length > 0 && setSelectedDays(val)}>
          {WEEK_DAYS.map((day) => {
            const isAllowed = allowedPattern.includes(day.value);
            return (
              <ToggleGroupItem key={day.value} value={day.value} disabled={!isAllowed} className={cn("flex-1 h-10 text-xs font-bold transition-all data-[state=on]:bg-primary data-[state=on]:text-primary-foreground", !isAllowed && "opacity-10 grayscale cursor-not-allowed")}>
                {day.label}
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      </Card>

      <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden relative min-h-[350px] shadow-inner">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-20"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-auto h-full">
            <Table className="border-separate border-spacing-0">
              <TableHeader className="sticky top-0 z-10 bg-muted/90 backdrop-blur-md">
                <TableRow>
                  <TableHead className="border-b border-r bg-muted/50 font-bold text-xs px-4">Membership Plan</TableHead>
                  <TableHead className="text-center border-b border-r bg-blue-50/50 text-blue-700 font-bold text-xs w-[180px]">Total Cost (₹)</TableHead>
                  {sortedTiers.map(tier => (
                    <TableHead key={tier} className="text-center font-bold text-[10px] uppercase border-b border-r px-4 whitespace-nowrap">{tier}+ Units Rate</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(groupedData).map((category) => {
                  const row = groupedData[category];
                  const rawRate = getApplicableRateForRow(category);
                  const mapping = getAccountMapping(category, row.masterId);
                  const isEligible = !!mapping;
                  const isSelected = selectedRate?.membershipType === category;

                  const factor = rawRate
                    ? getDiscountFactor(rawRate.minDaysInEnr || 0, rawRate.discountOnDayReduce || 0)
                    : 1;
                  const unitRate = rawRate?.unitRate ?? 1;

                  const finalDays = rawRate?.unitRate
                    ? finalBalance / (Number(unitRate) * factor)
                    : 0; // const finalDays = rawRate ? (Number(rawRate.unitRate) * factor * billingDaysSessions * (activeCourse?.chargingPattern?.toLowerCase() === "school" ? membersEnrolled : 1)) : 0;

                  return (
                    <TableRow key={category} className={cn("group transition-none", isSelected && "bg-primary/5", !isEligible && "opacity-40 grayscale-[0.8]")}>
                      <TableCell className="font-bold border-b border-r text-sm px-4">
                        <div className="flex items-center gap-2">
                          {!isEligible && <Lock className="w-3 h-3 text-muted-foreground" />}
                          {category}
                        </div>
                      </TableCell>
                      <TableCell
                        onClick={() => isEligible && handleSelectRow(category)}
                        className={cn(
                          "text-center border-b border-r font-mono font-black text-lg transition-all",
                          isEligible ? "cursor-pointer" : "cursor-not-allowed",
                          isSelected ? "bg-primary text-primary-foreground shadow-inner" : isEligible ? "bg-blue-50/20 text-blue-600 hover:bg-blue-100/50" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {Math.floor(finalDays)}
                        {isSelected && <CheckCircle2 className="inline ml-2 w-4 h-4 animate-in zoom-in" />}
                      </TableCell>
                      {sortedTiers.map(tier => {
                        const tierData = row.tiers[tier];
                        const isSource = rawRate?.aboveUnits === tier;
                        const tFactor = tierData ? getDiscountFactor(tierData.minDaysInEnr || 0, tierData.discountOnDayReduce || 0) : 1;
                        return (
                          <TableCell key={tier} className={cn("text-center border-b border-r font-mono text-xs px-4", isSource && !isSelected && "bg-green-500/5 text-green-700 font-bold")}>
                            {tierData ? (
                              <div className="flex flex-col">
                                {tFactor < 1 && <span className="text-[10px] line-through opacity-30">₹{Number(tierData.unitRate).toFixed(2)}</span>}
                                <span className={cn(tFactor < 1 ? "text-green-600 font-bold" : "text-muted-foreground")}>₹{(Number(tierData.unitRate) * tFactor).toFixed(2)}</span>
                              </div>
                            ) : "—"}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </motion.div>
  )
}