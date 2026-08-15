import { motion } from "framer-motion"
import {
	Database,
	AlertCircle,
	CheckCircle2,
	Calculator,
	Tag,
	Clock,
	FileJson,
	FileText
} from "lucide-react"
import type { Enrollment } from "@/types/enrollment"
import { cn } from "@/lib/utils"

interface DebuggerProps {
	data?: Enrollment
}

export function EnrollmentDataDebugger({ data }: DebuggerProps) {
	if (!data) return (
		<div className="p-8 text-center border-2 border-dashed rounded-2xl">
			<AlertCircle className="mx-auto h-10 w-10 text-muted-foreground opacity-20 mb-2" />
			<p className="text-lg font-medium text-muted-foreground">No Enrollment Data initialized</p>
		</div>
	);

	const Field = ({ label, value, highlight = false }: { label: string, value: any, highlight?: boolean }) => {
		const isMissing = value === undefined || value === null || value === "";
		return (
			<div className={cn(
				"flex justify-between items-center p-3 rounded-lg border transition-all",
				isMissing ? "bg-red-500/5 border-red-200/50" : "bg-background border-border",
				highlight && !isMissing && "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
			)}>
				<span className="text-[13px] font-bold text-muted-foreground uppercase tracking-tight">{label}</span>
				<span className={cn(
					"text-base font-mono font-bold",
					isMissing ? "text-red-500 italic" : highlight ? "text-primary" : "text-foreground"
				)}>
					{isMissing ? "MISSING" : String(value)}
				</span>
			</div>
		);
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="space-y-8 p-2 pb-20"
		>
			<div className="flex items-center gap-3 border-b pb-4">
				<div className="bg-slate-900 p-2 rounded-lg"><Database className="text-white w-6 h-6" /></div>
				<div>
					<h2 className="text-3xl font-black tracking-tight">Data Integrity Check</h2>
					<p className="text-muted-foreground font-medium text-lg">Verify all {Object.keys(data).length} enrollment schema fields</p>
				</div>
			</div>

			<div className="space-y-4">
				<div className="flex items-center gap-2 text-primary font-black text-sm uppercase tracking-[0.2em]">
					<Calculator size={18} /> Tax & Rounding Engine
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<Field label="CGST Amount" value={data.cgstAmount} highlight />
					<Field label="SGST Amount" value={data.sgstAmount} highlight />
					<Field label="Rounded Amount" value={data.roundedAmount} highlight />
					<Field label="Total Debit" value={data.totalDebitAmount} highlight />
				</div>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

				<section className="space-y-4">
					<h3 className="flex items-center gap-2 text-blue-600 font-black text-sm uppercase tracking-widest">
						<Tag size={18} /> Identifiers & IDs
					</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<Field label="Enrollment ID" value={data.enrollmentId} />
						<Field label="Enrollment No" value={data.enrollmentNo} />
						<Field label="Member ID" value={data.member?.memberId} />
						<Field label="Activity ID" value={data.activityId} />
						<Field label="Course ID" value={data.courseId} />
						<Field label="Batch ID" value={data.batch?.batchId} />
						<Field label="Account ID" value={data.accountId} />
						<Field label="DN Account ID" value={data.dnAccountId} />
						<Field label="Membership Master ID" value={data.membershipMasterId} />
						<Field label="Membership ID" value={data.membershipId} />
					</div>
				</section>

				<section className="space-y-4">
					<h3 className="flex items-center gap-2 text-orange-600 font-black text-sm uppercase tracking-widest">
						<Clock size={18} /> Schedule & Logistics
					</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<Field label="Start Date" value={data.attendingStartDate} />
						<Field label="End Date" value={data.endDate} />
						<Field label="Start Time" value={data.startTime} />
						<Field label="Pattern" value={data.attendingPattern} />
						<Field label="Pattern Days" value={data.attendingPatternDays} />
						<Field label="Billing Sessions" value={data.billingDaysSessions} />
						<Field label="Members Enrolled" value={data.membersEnrolled} />
						<Field label="Permitted Days" value={data.permittedDays} />
					</div>
				</section>

				<section className="space-y-4 lg:col-span-2">
					<h3 className="flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-widest">
						<FileText size={18} /> Strings & Remarks
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
						<Field label="Account Name" value={data.accountName} />
						<Field label="Member First" value={data.member?.memberFirstName} />
						<Field label="Member Last" value={data.member?.memberLastName ?? "Not available"} />
						<Field label="Activity Name" value={data.course?.activityName} />
						<Field label="Course Name" value={data.course?.courseName} />
						<Field label="Entity Name" value={data.course?.entityName} />
						<Field label="Walking Name" value={data.walkingName} />
						<Field label="Walking Contact" value={data.walkingContact} />
						<Field label="Status" value={data.status} />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
						<div className="p-3 border rounded-lg bg-muted/20">
							<p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Office Remarks</p>
							<p className="text-sm font-medium">{data.officeRemarks || "---"}</p>
						</div>
						<div className="p-3 border rounded-lg bg-muted/20">
							<p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Print Remarks</p>
							<p className="text-sm font-medium">{data.printRemarks || "---"}</p>
						</div>
					</div>
				</section>

				<section className="space-y-4 lg:col-span-2">
					<h3 className="flex items-center gap-2 text-slate-500 font-black text-sm uppercase tracking-widest">
						<FileJson size={18} /> Nested Object Objects
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-5 gap-3">
						<ObjectBadge label="Member" exists={!!data.member} />
						<ObjectBadge label="Course" exists={!!data.course} />
						<ObjectBadge label="Activity" exists={!!data.activity} />
						<ObjectBadge label="Batch" exists={!!data.batch} />
						<ObjectBadge label="Bill" exists={!!data.bill} />
					</div>
				</section>
			</div>
		</motion.div>
	)
}

function ObjectBadge({ label, exists }: { label: string, exists: boolean }) {
	return (
		<div className={cn(
			"flex items-center justify-between px-3 py-4 rounded-xl border-2 transition-all",
			exists ? "bg-green-500/10 border-green-500/50 text-green-700" : "bg-red-500/10 border-red-500/50 text-red-700"
		)}>
			<span className="font-black text-xs uppercase tracking-tighter">{label}</span>
			{exists ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
		</div>
	)
}