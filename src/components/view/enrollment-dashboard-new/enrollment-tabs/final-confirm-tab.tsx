"use client"

import { useMemo, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import {
	User, BookOpen, FileText, Clock, BadgeCheck, Coins,
	Calculator, ArrowDownToLine, Scale
} from "lucide-react"
import { format, parseISO, addMinutes } from "date-fns"

// UI Components
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Enrollment as EnrollmentData } from "@/types/enrollment"
import { EnrollmentDataDebugger } from "./EnrollmentDataDebugger"

interface FinalConfirmTabProps {
	data?: EnrollmentData,
	onUpdate: (data: Partial<EnrollmentData>) => void
}

const FinalConfirmTab = ({ data, onUpdate }: FinalConfirmTabProps) => {
	const lastCalculatedRef = useRef<string>("");

	const results = useMemo(() => {
		if (!data?.course || !data?.courseRate) return null;

		const { course, courseRate: selectedRate } = data;

		// --- 1. Internal Precision Inputs (5 Digits) ---
		const cgstRate = Number(parseFloat(String(course.cgstRate)).toFixed(5));
		const sgstRate = Number(parseFloat(String(course.sgstRate)).toFixed(5));
		const rackPrice = Number(parseFloat(String(selectedRate.unitRate)).toFixed(5));
		const patternDiscount = Number(parseFloat(String(data.patternDiscount)).toFixed(5)) || 1;
		const dnOrDiscount = Number(parseFloat(String(data.dnOrDiscount)).toFixed(5)) || 0;
		const processingCharge = Number(parseFloat(String(data.processingCharge)).toFixed(5)) || 0;
		const billingDaysSessions = Number(data.billingDaysSessions) || 1;
		const membersEnrolled = Number(data.membersEnrolled) || 1;
		const hasDnAccount = !!data.dnAccountId && data.dnAccountId !== 0;

		// --- 2. Math Engine (5 Decimal Precision) ---
		let baseRateD = hasDnAccount
			? (rackPrice * patternDiscount)
			: (rackPrice * patternDiscount) - (dnOrDiscount / billingDaysSessions);

		baseRateD = Number(baseRateD.toFixed(5));

		const A = ((baseRateD * billingDaysSessions) + processingCharge);
		const B = 100 + sgstRate + cgstRate;
		const C = A * (B / 100);
		const X = Math.ceil(Number(C.toFixed(5))); // Standard ceiling on 5-digit precision
		const E = X - C;
		const roundedAmount = ((100 * E) / B);

		const costToMember = ((rackPrice * patternDiscount) - (dnOrDiscount / billingDaysSessions));
		const billingAmount = baseRateD * billingDaysSessions * membersEnrolled;

		const cgstAmount = (billingAmount + (processingCharge * membersEnrolled) + roundedAmount) * (cgstRate / 100);
		const sgstAmount = (billingAmount + (processingCharge * membersEnrolled) + roundedAmount) * (sgstRate / 100);

		// Final sum check
		const rawTotal = (costToMember * billingDaysSessions * membersEnrolled) + cgstAmount + sgstAmount + (processingCharge * membersEnrolled) + roundedAmount;

		// --- 3. Bug Check (Integer Validation) ---
		// We check if the difference from the nearest integer is greater than a microscopic epsilon

		// --- 4. Date Logic ---
		let calculatedEndTime = data.startTime || "";
		if (data.attendingStartDate && data.startTime && course.sessionMinutes) {
			const startDateTime = parseISO(`${data.attendingStartDate}T${data.startTime}`);
			const endDateTime = addMinutes(startDateTime, course.sessionMinutes);
			calculatedEndTime = format(endDateTime, "HH:mm:ss");
		}

		return {
			internal: { A, B, C, X, E, rawTotal },
			display: {
				billingRate: Number(baseRateD.toFixed(2)),
				billingAmount: Number(billingAmount.toFixed(2)),
				roundedAmount: Number(roundedAmount.toFixed(2)),
				cgstAmount: Number(cgstAmount.toFixed(2)),
				sgstAmount: Number(sgstAmount.toFixed(2)),
				totalDebitAmount: Math.round(rawTotal),
				costToMember: Number(costToMember.toFixed(2)),
				calculatedEndTime,
				cgstRate,
				sgstRate
			}
		};
	}, [data]);

	// Sync 2-digit decimals to parent state
	useEffect(() => {
		if (results) {
			const signature = JSON.stringify(results.display);
			if (lastCalculatedRef.current !== signature) {
				lastCalculatedRef.current = signature;
				onUpdate(results.display);
			}
		}
	}, [results, onUpdate]);

	if (!data || !results) return null;

	const { display, internal } = results;

	// Console Perfection (5-digit internal view)
	console.group("%c🧮 High-Precision Calculation (5-Digits)", "color: #8b5cf6; font-weight: bold;");
	console.table(internal);
	console.groupEnd();

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

			{/* --- HERO BILLING SECTION --- */}
			<Card className="border-none shadow-2xl bg-slate-950 text-white overflow-hidden rounded-3xl">
				<div className="bg-primary px-8 py-4 flex justify-between items-center">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-white/20 rounded-xl"><Calculator size={24} /></div>
						<div>
							<h2 className="text-xl font-black uppercase tracking-tighter italic">Billing Confirmation</h2>
							<p className="text-[10px] opacity-80 font-bold uppercase tracking-widest leading-none">5-Decimal Precision Engine</p>
						</div>
					</div>
					<div className="text-right">
						<p className="text-[10px] font-black uppercase opacity-60">Payable Amount</p>
						<p className="text-3xl font-mono font-black">₹{display.totalDebitAmount.toLocaleString('en-IN')}.00</p>
					</div>
				</div>

				<div className="p-8 grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
					<div className="space-y-1">
						<p className="text-[11px] font-black text-primary uppercase flex items-center gap-2"><Coins size={14} /> Rate/Unit</p>
						<p className="text-2xl font-black font-mono text-white">₹{display.billingRate.toFixed(2)}</p>
					</div>

					<div className="space-y-2">
						<p className="text-[11px] font-black text-primary uppercase flex items-center gap-2"><Scale size={14} /> Taxes</p>
						<div className="flex justify-between text-xs font-bold">
							<span className="text-slate-400">GST Sum ({display.cgstRate + display.sgstRate}%)</span>
							<span className="text-emerald-400">₹{(display.cgstAmount + display.sgstAmount).toFixed(2)}</span>
						</div>
					</div>

					<div className="space-y-1">
						<p className="text-[11px] font-black text-primary uppercase flex items-center gap-2"><ArrowDownToLine size={14} /> Rounded</p>
						<p className="text-xl font-black font-mono text-orange-400">₹{display.roundedAmount.toFixed(2)}</p>
					</div>

					<div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
						<Badge className="bg-emerald-500 text-[10px] font-black mb-1">FINAL TOTAL</Badge>
						<p className="text-4xl font-black text-white tracking-tighter">₹{display.totalDebitAmount}</p>
					</div>
				</div>
			</Card>

			{/* --- DETAILS GRID --- */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Member */}
				<Card className="p-5 h-full bg-card border-2 border-border shadow-sm">
					<div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest mb-3">
						<User size={16} /> Member Details
					</div>
					<p className="text-lg font-black leading-tight">{data.member?.memberFirstName} {data.member?.memberLastName}</p>
					<p className="text-xs font-bold text-muted-foreground mt-1">ID: #{data.member?.memberId}</p>
				</Card>

				{/* Training */}
				<Card className="p-5 h-full bg-card border-2 border-border shadow-sm">
					<div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest mb-3">
						<BookOpen size={16} /> Program
					</div>
					<p className="text-lg font-black leading-tight">{data.course?.courseName}</p>
					<p className="text-xs font-bold text-primary mt-1 uppercase italic">{data.batch?.batchName}</p>
				</Card>

				{/* Timing */}
				<Card className="p-5 h-full bg-card border-2 border-border shadow-sm">
					<div className="flex items-center gap-2 text-orange-600 font-black text-[10px] uppercase tracking-widest mb-3">
						<Clock size={16} /> Timing
					</div>
					<div className="flex justify-between items-end">
						<div className="space-y-1">
							<p className="text-xs font-bold text-muted-foreground">Session</p>
							<p className="text-lg font-black font-mono">{data.startTime} - {display.calculatedEndTime}</p>
						</div>
						<Badge variant="outline" className="font-black text-[9px]">{data.status}</Badge>
					</div>
				</Card>

				{/* Remarks */}
				<Card className="md:col-span-3 p-4 bg-muted/10 border-2 border-dashed border-border/60 flex flex-col md:flex-row gap-4">
					<div className="flex-1 space-y-1">
						<p className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-2"><FileText size={12} /> Internal Remarks</p>
						<p className="text-xs italic text-foreground/80 bg-background p-3 rounded-xl border border-border/40">{data.officeRemarks || "N/A"}</p>
					</div>
					<div className="flex-1 space-y-1">
						<p className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-2"><BadgeCheck size={12} /> Print Remarks</p>
						<p className="text-xs italic text-foreground/80 bg-background p-3 rounded-xl border border-border/40">{data.printRemarks || "N/A"}</p>
					</div>
				</Card>
			</div>

			{/* Debugger for Developer */}
			<div className="mt-8 pt-8 border-t">
				<p className="text-red-500 font-black text-xs uppercase tracking-widest mb-4">Internal Data Debugger</p>
				<EnrollmentDataDebugger data={data as any} />
			</div>
		</motion.div>
	)
}

export default FinalConfirmTab