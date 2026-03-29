import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import {
	CheckCircle2, Loader2,
	Calculator, Calendar as CalendarIcon, Clock, Users as UsersIcon, Lock
} from "lucide-react"
import { format, addDays, isAfter, parseISO, startOfToday } from "date-fns"

import { getCourseRates } from "@/api/courseRate.api"
import { getMembershipsByMember } from "@/api/member.api"
import type { Enrollment, Enrollment as EnrollmentData } from "@/types/enrollment"
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
import { useLocation } from "react-router-dom"
import { process1 } from "@/helpers/enrollment-change/process1"
import { calsPermittedDays } from "@/helpers/calculatePermittedDays"

const WEEK_DAYS = [
	{ label: "Mon", value: "1" },
	{ label: "Tue", value: "2" },
	{ label: "Wed", value: "3" },
	{ label: "Thu", value: "4" },
	{ label: "Fri", value: "5" },
	{ label: "Sat", value: "6" },
	{ label: "Sun", value: "7" },
];

interface ProcessValues {
	value1?: number
	value2?: number
	value3?: number
	value4?: number
	value5?: number
	value6?: string
}

interface CourseRateTabProps {
	data?: EnrollmentData
	onUpdate: (data: Partial<EnrollmentData>) => void
	setChangeVersions: any
}

function reverseCalcUnits(
	availableAmount: number,
	unitRate: number,
	cgstRate: number,
	sgstRate: number,
	processingCharge: number = 0,
	startDate: string = new Date().toISOString(),
): number {
	if (!availableAmount || availableAmount <= 0 || !unitRate) return 1;
	const { permittedDays } = calsPermittedDays({
		oldBillingAmount: availableAmount,
		pc: processingCharge,
		cgst: cgstRate,
		sgst: sgstRate,
		unitRate,
		startDays: startDate,
	});
	return Math.max(1, permittedDays);
}

export function CourseRateTab({ data, onUpdate, setChangeVersions }: CourseRateTabProps) {
	const activeCourse = data?.course;
	const allowedPattern = activeCourse?.daysPattern || "1234567";
	const location = useLocation()

	const [processValues, setProcessValues] = useState<ProcessValues>({});

	useEffect(() => {
		const getProcessData = async (enrollment: Enrollment) => {
			if (enrollment) {
				const res = await process1(enrollment, new Date("2026-05-01"), 100, false);
				setChangeVersions(res);
				setProcessValues(res.values || {});
			}
		}

		if (location.state) {
			if (location.state.type == "CHANGE_COURSE" && location.state.enrollment) {
				getProcessData({ ...location.state.enrollment })
			}
		}
	}, [location.state])

	const [rates, setRates] = useState<CourseRate[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [selectedRate, setSelectedRate] = useState<CourseRate | null>(data?.courseRate || null)

	const [billingDaysSessions, setBillingDaysSessions] = useState(data?.billingDaysSessions || "1")
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

	const availableBalance = processValues.value4 ?? null;

	const reverseAppliedRef = useRef<{ balance: number | null; courseId: number | null }>({
		balance: null,
		courseId: null,
	});

	const actualDaysInWeek = selectedDays.length;
	const selectedCourseDayInWeek = allowedPattern.length;

	const getDiscountFactor = useCallback((rateDaysInWeek: number, disc: number) => {
		const finalDaysInWeek = Math.max(rateDaysInWeek || 0, actualDaysInWeek || 0);
		return 1 - (selectedCourseDayInWeek - finalDaysInWeek) * (Number(disc) / 100);
	}, [actualDaysInWeek, selectedCourseDayInWeek]);

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
			setEndDate(format(addDays(startDate, (Number(billingDaysSessions) * mult) - 1), "yyyy-MM-dd"));
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

	const walkInCategoryKey = useMemo(() => {
		return Object.keys(groupedData).find(k => k.toLowerCase().includes("walk in")) || null;
	}, [groupedData]);

	useEffect(() => {
		const currentCourseId = activeCourse?.courseId ?? null;

		if (availableBalance == null || !walkInCategoryKey || !groupedData[walkInCategoryKey]) return;
		if (sortedTiers.length === 0) return;

		if (
			reverseAppliedRef.current.balance === availableBalance &&
			reverseAppliedRef.current.courseId === currentCourseId
		) return;

		const row = groupedData[walkInCategoryKey];
		const mapping = getAccountMapping(walkInCategoryKey, row.masterId);
		if (!mapping) return;

		const isSchool = activeCourse?.chargingPattern?.toLowerCase() === "school";

		const lowestTier = sortedTiers[0];
		const lowestRate = row.tiers[lowestTier];
		if (!lowestRate) return;

		const calculatedUnits = reverseCalcUnits(
			availableBalance,
			Number(lowestRate.unitRate),
			Number(activeCourse?.cgstRate ?? 0),
			Number(activeCourse?.sgstRate ?? 0),
			0,
			format(startDate, "yyyy-MM-dd"),
		);

		reverseAppliedRef.current = { balance: availableBalance, courseId: currentCourseId };

		setBillingDaysSessions(calculatedUnits);

		const targetTier = sortedTiers.filter(t => t <= calculatedUnits).reverse()[0] || sortedTiers[0];
		const rawRate = row.tiers[targetTier]
			?? (() => {
				const lower = Object.keys(row.tiers).map(Number).filter(t => t < targetTier).sort((a, b) => b - a);
				return lower.length > 0 ? row.tiers[lower[0]] : null;
			})();

		if (!rawRate) return;

		const factor = getDiscountFactor(rawRate.minDaysInEnr || 0, rawRate.discountOnDayReduce || 0);
		setSelectedRate(rawRate);

		onUpdate({
			courseRate: rawRate,
			billingDaysSessions: calculatedUnits,
			attendingStartDate: format(startDate, "yyyy-MM-dd"),
			endDate,
			startTime,
			membersEnrolled: isSchool ? membersEnrolled : 1,
			attendingPattern: selectedDays.sort().join(""),
			attendingPatternDays: selectedDays.length,
			patternDiscount: factor,
			billingRate: Number(rawRate.unitRate) * factor,
			accountId: mapping.accountId,
			accountName: mapping.accountName,
			membershipId: mapping.membershipId,
			membershipMasterId: row.masterId,
			permittedDays: calculatedUnits * Number(activeCourse?.unitsMultipleOf || 1)
		});
	}, [availableBalance, walkInCategoryKey, sortedTiers]);

	const getApplicableRateForRow = (category: string) => {
		const row = groupedData[category];
		if (!row) return null;
		const targetTier = sortedTiers.filter(t => t <= Number(billingDaysSessions)).reverse()[0] || sortedTiers[0];
		if (row.tiers[targetTier]) return row.tiers[targetTier];
		const lower = Object.keys(row.tiers).map(Number).filter(t => t < targetTier).sort((a, b) => b - a);
		return lower.length > 0 ? row.tiers[lower[0]] : null;
	}

	const handleSelectRow = (category: string) => {
		const row = groupedData[category];
		const mapping = getAccountMapping(category, row.masterId);
		if (!mapping) return;

		let units = billingDaysSessions;
		let rawRate = getApplicableRateForRow(category);

		if (availableBalance != null && availableBalance > 0) {
			const lowestTier = sortedTiers[0];

			const lowestRate = row.tiers[lowestTier];
			const unitRateForCalc = lowestRate ? Number(lowestRate.unitRate) : 1;

			units = reverseCalcUnits(
				availableBalance,
				unitRateForCalc,
				Number(activeCourse?.cgstRate ?? 0),
				Number(activeCourse?.sgstRate ?? 0),
				0,
				format(startDate, "yyyy-MM-dd"),
			);
			setBillingDaysSessions(units);

			const targetTier = sortedTiers.filter(t => t <= Number(units)).reverse()[0] || sortedTiers[0];
			rawRate = row.tiers[targetTier]
				|| (() => {
					const lower = Object.keys(row.tiers).map(Number).filter(t => t < targetTier).sort((a, b) => b - a);
					return lower.length > 0 ? row.tiers[lower[0]] : null;
				})();
		}

		if (!rawRate) return;

		const factor = getDiscountFactor(rawRate.minDaysInEnr || 0, rawRate.discountOnDayReduce || 0);
		setSelectedRate(rawRate);

		onUpdate({
			courseRate: rawRate,
			billingDaysSessions: Number(units),
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
			permittedDays: (Number(units) * Number(activeCourse?.unitsMultipleOf || 1))
		});
	};

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full space-y-4 pb-10">
			{availableBalance != null && (
				<div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
					<span className="text-xs font-bold uppercase tracking-wide">Available Balance</span>
					<span className="text-base font-black font-mono">
						₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
					</span>
					<span className="text-[10px] text-emerald-600 italic">Units auto-calculated from balance</span>
				</div>
			)}

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
					<Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
						<Calculator size={12} /> UNITS
						{availableBalance != null && <span className="ml-1 text-emerald-600 font-normal normal-case">(from balance)</span>}
					</Label>
					<Input
						type="number"
						className={cn(
							"h-10 text-xs font-mono",
							availableBalance != null &&
							"border-emerald-400 bg-emerald-50/50 text-emerald-800 font-bold"
						)}
						value={billingDaysSessions}
						onChange={(e) => {
							const val = e.target.value;
							const newUnits = val === "" ? "" : Number(val);
							setBillingDaysSessions(newUnits);

							if (selectedRate) {
								setSelectedRate(null);
								onUpdate({
									courseRate: undefined,
									billingRate: 0,
									permittedDays: Number(newUnits) * Number(activeCourse?.unitsMultipleOf || 1)
								});
							}
						}}
					/>
				</div>
				{activeCourse?.chargingPattern?.toLowerCase() === "school" && (
					<div className="space-y-1.5">
						<Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1"><UsersIcon size={12} /> Members</Label>
						<Input type="number" className="h-10 text-xs" disabled={activeCourse?.chargingPattern?.toLowerCase() !== "school"} value={membersEnrolled} onChange={(e) => setMembersEnrolled(Number(e.target.value))} />
					</div>
				)}
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
									<TableHead className="text-center border-b border-r bg-blue-50/50 text-blue-700 font-bold text-xs w-[200px]">
										Total Cost (₹)
										{availableBalance != null && (
											<span className="block text-[9px] font-normal text-emerald-600 normal-case">← Units reversed from balance</span>
										)}
									</TableHead>
									{sortedTiers.map(tier => (
										<TableHead key={tier} className="text-center font-bold text-[10px] uppercase border-b border-r px-4 whitespace-nowrap">{tier}+ Units Rate</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{Object.keys(groupedData).map((category) => {
									const row = groupedData[category];
									const isWalkIn = category.toLowerCase().includes("walk in");
									const mapping = getAccountMapping(category, row.masterId);
									const isEligible = !!mapping;
									const isSelected = selectedRate?.membershipType === category;
									const isAutoSelected = isWalkIn && availableBalance != null && isSelected;

									const rawRate = getApplicableRateForRow(category);
									const factor = rawRate ? getDiscountFactor(rawRate.minDaysInEnr || 0, rawRate.discountOnDayReduce || 0) : 1;

									const finalTotal = rawRate
										? (Number(rawRate.unitRate) * factor * Number(billingDaysSessions) * (activeCourse?.chargingPattern?.toLowerCase() === "school" ? membersEnrolled : 1))
										: 0;

									return (
										<TableRow
											key={category}
											className={cn(
												"group transition-none",
												isSelected && "bg-primary/5",
												!isEligible && "opacity-40 grayscale-[0.8]",
												isAutoSelected && "ring-2 ring-emerald-400 ring-inset"
											)}
										>
											<TableCell className="font-bold border-b border-r text-sm px-4">
												<div className="flex items-center gap-2">
													{!isEligible && <Lock className="w-3 h-3 text-muted-foreground" />}
													{category}
													{isAutoSelected && (
														<span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">AUTO</span>
													)}
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
												₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
												{isSelected && <CheckCircle2 className="inline ml-2 w-4 h-4 animate-in zoom-in" />}
												{availableBalance != null && isEligible && !isSelected && (
													<span className="block text-[10px] font-normal opacity-60">
														{reverseCalcUnits(
															availableBalance,
															Number(row.tiers[sortedTiers[0]]?.unitRate ?? 1),
															Number(activeCourse?.cgstRate ?? 0),
															Number(activeCourse?.sgstRate ?? 0),
															0,
															format(startDate, "yyyy-MM-dd"),
														)} units
													</span>
												)}
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