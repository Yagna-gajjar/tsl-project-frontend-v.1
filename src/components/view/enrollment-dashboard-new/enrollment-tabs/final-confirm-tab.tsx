"use client"

import { useMemo, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import {
	User, BookOpen, FileText, Clock, BadgeCheck, Coins, ArrowDownToLine, Scale, Receipt
} from "lucide-react"
import { format, parseISO, addMinutes } from "date-fns"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Enrollment as EnrollmentData } from "@/types/enrollment"
import ExcelInvoice from "../EnrollmentPreview"

interface FinalConfirmTabProps {
	data?: EnrollmentData,
	onUpdate: (data: Partial<EnrollmentData>) => void
}

const FinalConfirmTab = ({ data, onUpdate }: FinalConfirmTabProps) => {
	const lastCalculatedRef = useRef<string>("");

	console.log(data, " = data");


	const excelEnrollmentData = {
		member: {
			memberId: data?.member?.memberId,
			memberFirstName: data?.member?.memberFirstName,
			dob: data?.member?.dob,
		},

		course: {
			entityId: data?.course?.entityId,
			entityName: data?.course?.entityName,
			courseName: data?.course?.courseName,
			chargingPattern: data?.course?.chargingPattern,
			sessionMinutes: data?.course?.sessionMinutes,
			activityId: data?.course?.activityId,
		},

		batch: {
			batchName: data?.batch?.batchName,
		},

		enrollmentNo: "Not Generated",
		enrollmentDate: format(Date.now(), "dd-MMM-yyyy"),
		enrollmentId: "Not Generated",

		walkingName: data?.walkingName,
		walkingContact: data?.walkingContact,

		accountName: data?.accountName,
		accountId: data?.accountId,

		membershipMasterId: data?.membershipMasterId,

		attendingPattern: data?.attendingPattern,
		attendingPatternDays: data?.attendingPatternDays,

		billingDaysSessions: data?.billingDaysSessions,
		permittedDays: data?.permittedDays,

		attendingStartDate: data?.attendingStartDate,
		endDate: data?.endDate,

		startTime: data?.startTime,
		endTime: data?.batch?.endTime,

		rackPrice: data?.courseRate?.unitRate,
		billingRate: data?.billingRate,
		billingAmount: data?.billingAmount,

		processingCharge: data?.processingCharge,
		dnOrDiscount: data?.dnOrDiscount,

		cgstAmount: data?.cgstAmount,
		sgstAmount: data?.sgstAmount,

		roundedAmount: data?.roundedAmount,
		totalDebitAmount: data?.totalDebitAmount,

		memberApprovalStatus: data?.academyApprovalStatus,
		printRemarks: data?.printRemarks,
	};
	const results = useMemo(() => {
		if (!data?.course || !data?.courseRate) return null;

		const { course, courseRate: selectedRate } = data;

		const cgstRate = Number(parseFloat(String(course.cgstRate)).toFixed(5));
		const sgstRate = Number(parseFloat(String(course.sgstRate)).toFixed(5));
		const rackPrice = Number(parseFloat(String(selectedRate.unitRate)).toFixed(5));
		const patternDiscount = Number(parseFloat(String(data.patternDiscount)).toFixed(5)) || 1;
		const dnOrDiscount = Number(parseFloat(String(data.dnOrDiscount)).toFixed(5)) || 0;
		const processingCharge = Number(parseFloat(String(data.processingCharge)).toFixed(5)) || 0;
		const billingDaysSessions = Number(data.billingDaysSessions) || 1;
		const membersEnrolled = Number(data.membersEnrolled) || 1;
		const hasDnAccount = !!data.dnAccountId && data.dnAccountId !== 0;

		let baseRateD = hasDnAccount
			? (rackPrice * patternDiscount)
			: (rackPrice * patternDiscount) - (dnOrDiscount / billingDaysSessions);

		baseRateD = Number(baseRateD.toFixed(5));

		const A = ((baseRateD * billingDaysSessions) + processingCharge);
		const B = 100 + sgstRate + cgstRate;
		const C = A * (B / 100);
		const X = Math.ceil(Number(C.toFixed(5)));
		const E = X - C;
		const roundedAmount = ((100 * E) / B);

		const costToMember = ((rackPrice * patternDiscount) - (dnOrDiscount / billingDaysSessions));
		const billingAmount = baseRateD * billingDaysSessions * membersEnrolled;

		const cgstAmount = (billingAmount + (processingCharge * membersEnrolled) + roundedAmount) * (cgstRate / 100);
		const sgstAmount = (billingAmount + (processingCharge * membersEnrolled) + roundedAmount) * (sgstRate / 100);

		const totalDebitAmount = (costToMember * billingDaysSessions * membersEnrolled) + cgstAmount + sgstAmount + (processingCharge * membersEnrolled) + roundedAmount;

		let calculatedEndTime = data.startTime || "";
		if (data.attendingStartDate && data.startTime && course.sessionMinutes) {
			const startDateTime = parseISO(`${data.attendingStartDate}T${data.startTime}`);
			const endDateTime = addMinutes(startDateTime, course.sessionMinutes);
			calculatedEndTime = format(endDateTime, "HH:mm:ss");
		}

		return {
			internal: { A, B, C, X, E, totalDebitAmount },
			display: {
				billingRate: Number(baseRateD.toFixed(2)),
				billingAmount: Number(billingAmount.toFixed(2)),
				roundedAmount: Number(roundedAmount.toFixed(2)),
				cgstAmount: Number(cgstAmount.toFixed(2)),
				sgstAmount: Number(sgstAmount.toFixed(2)),
				totalDebitAmount: Math.round(totalDebitAmount),
				costToMember: Number(costToMember.toFixed(2)),
				calculatedEndTime,
				cgstRate,
				sgstRate
			}
		};
	}, [data]);

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
	const { display } = results;

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="space-y-6 max-w-6xl mx-auto pb-10"
		>
			<Card className="border-2 border-border shadow-xl bg-card rounded-[2rem] overflow-hidden">
				<div className="bg-muted/50 px-8 py-5 flex justify-between items-center border-b">
					<div className="flex items-center gap-4">
						<div className="p-3 bg-primary/10 rounded-2xl text-primary">
							<Receipt size={28} />
						</div>
						<div>
							<h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Billing Statement</h2>
							<p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none">
								Transaction Summary • High Precision
							</p>
						</div>
					</div>
					<div className="text-right">
						<p className="text-[10px] font-black uppercase text-muted-foreground">Total Payable</p>
						<p className="text-4xl font-mono font-black text-primary tracking-tighter">
							₹{display.totalDebitAmount.toLocaleString('en-IN')}.00
						</p>
					</div>
				</div>

				<div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
					<div className="space-y-2">
						<p className="text-[11px] font-black text-muted-foreground uppercase flex items-center gap-2"><Coins size={16} className="text-amber-500" /> Unit Rate</p>
						<p className="text-3xl font-black font-mono">₹{display.billingRate.toFixed(2)}</p>
						<p className="text-[10px] text-muted-foreground font-bold uppercase">Net per {data.chargingPattern}</p>
					</div>

					<div className="space-y-2">
						<p className="text-[11px] font-black text-muted-foreground uppercase flex items-center gap-2"><Scale size={16} className="text-blue-500" /> GST Components</p>
						<div className="space-y-1">
							<div className="flex justify-between text-xs font-bold">
								<span className="text-muted-foreground">CGST ({display.cgstRate}%)</span>
								<span>₹{display.cgstAmount.toFixed(2)}</span>
							</div>
							<div className="flex justify-between text-xs font-bold">
								<span className="text-muted-foreground">SGST ({display.sgstRate}%)</span>
								<span>₹{display.sgstAmount.toFixed(2)}</span>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<p className="text-[11px] font-black text-muted-foreground uppercase flex items-center gap-2"><ArrowDownToLine size={16} className="text-orange-500" /> Rounding</p>
						<p className="text-2xl font-black font-mono text-orange-600">
							{display.roundedAmount >= 0 ? "+" : ""}₹{display.roundedAmount.toFixed(2)}
						</p>
						<p className="text-[10px] text-muted-foreground font-bold uppercase">Final Adjustment</p>
					</div>

					<div className="bg-primary/5 p-6 rounded-[1.5rem] border border-primary/10 flex flex-col justify-center items-center text-center">
						<Badge className="bg-primary text-[10px] font-black mb-2 px-3 py-0.5">FINAL TOTAL</Badge>
						<p className="text-4xl font-black text-primary">₹{display.totalDebitAmount}</p>
					</div>
				</div>
			</Card>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">

				<Card className="p-6 border border-border shadow-sm rounded-3xl space-y-4 bg-card">
					<div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest">
						<User size={18} /> Member Info
					</div>
					<div className="space-y-1">
						<p className="text-xl font-black leading-tight">{data.member?.memberFirstName} {data.member?.memberLastName}</p>
						<p className="text-xs font-bold text-muted-foreground">Member ID: #{data.member?.memberId}</p>
					</div>
					<Separator className="opacity-50" />
					<p className="text-sm font-bold flex justify-between">
						<span className="text-muted-foreground font-black text-[10px] uppercase">Contact</span>
						<span>{data.member?.contactNumber}</span>
					</p>
				</Card>

				<Card className="p-6 border border-border shadow-sm rounded-3xl space-y-4 bg-card">
					<div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
						<BookOpen size={18} /> Program Details
					</div>
					<div className="space-y-1">
						<p className="text-xl font-black leading-tight">{data.course?.courseName}</p>
						<Badge variant="secondary" className="font-black uppercase text-[10px] h-5">{data.batch?.batchName}</Badge>
					</div>
					<Separator className="opacity-50" />
					<div className="flex justify-between text-xs font-bold">
						<div className="flex flex-col">
							<span className="text-[9px] text-muted-foreground uppercase">Period</span>
							<span>{data.attendingStartDate ? format(parseISO(data.attendingStartDate), "dd MMM yy") : "—"} to {data.endDate ? format(parseISO(data.endDate), "dd MMM yy") : "—"}</span>
						</div>
					</div>
				</Card>

				<Card className="p-6 border border-border shadow-sm rounded-3xl space-y-4 bg-card">
					<div className="flex items-center gap-2 text-orange-600 font-black text-[10px] uppercase tracking-widest">
						<Clock size={18} /> Schedule
					</div>
					<div className="space-y-3">
						<div className="flex justify-between items-center bg-muted/50 p-3 rounded-2xl border">
							<span className="text-[10px] font-black uppercase text-muted-foreground">Session</span>
							<span className="font-mono font-black text-base">{data.startTime} - {display.calculatedEndTime}</span>
						</div>
						<div className="flex justify-between items-center px-1">
							<span className="text-[10px] font-black uppercase text-muted-foreground">Pattern</span>
							<span className="text-xs font-black uppercase">{data.attendingPattern}</span>
						</div>
					</div>
				</Card>

				<Card className="md:col-span-3 p-6 bg-muted/20 border-2 border-dashed rounded-[2rem] grid grid-cols-1 md:grid-cols-2 gap-8">
					<div className="space-y-2">
						<p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
							<FileText size={14} className="text-emerald-600" /> Internal Notes
						</p>
						<p className="text-sm italic font-medium text-foreground/70 bg-background p-4 rounded-2xl border min-h-[60px] shadow-sm">
							{data.officeRemarks || "No internal comments provided."}
						</p>
					</div>
					<div className="space-y-2">
						<p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
							<BadgeCheck size={14} className="text-emerald-600" /> Invoice Remarks
						</p>
						<p className="text-sm italic font-medium text-foreground/70 bg-background p-4 rounded-2xl border min-h-[60px] shadow-sm">
							{data.printRemarks || "No invoice remarks provided."}
						</p>
					</div>
				</Card>
			</div>

			<div className="overflow-auto">
				<ExcelInvoice
					enrollmentData={excelEnrollmentData as any}
				/>
			</div>

			{/* Developer Debugger */}
			{/* <div className="mt-12 pt-8 border-t">
				<p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mb-4 text-center">System Data Inspect Mode</p>
				<EnrollmentDataDebugger data={data as any} />
			</div> */}
		</motion.div>
	)
}

export default FinalConfirmTab