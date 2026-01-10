import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table";
import {
	ChevronLeft,
	Save,
	Loader2,
	Calendar,
	IndianRupee,
	Percent,
	ClipboardList,
	TrendingUp,
	Settings2,
	Database,
	Layers
} from "lucide-react";

import { format } from "date-fns";
// Importing your config object
import { ENROLLMENT_WORKFLOW_CONFIG } from "@/helpers/enrollment-change/workflow";
import { process1 } from "@/helpers/enrollment-change/process1";
import { process7 } from "@/helpers/enrollment-change/process7";

const ChangeEnrollment = () => {
	const location = useLocation();
	const navigate = useNavigate();

	const { enrollmentId, actionType, enrollmentData } = location.state || {};

	// Get the specific config for the current action
	const currentConfig = ENROLLMENT_WORKFLOW_CONFIG[actionType];

	const [processedData, setProcessedData] = useState<{ modify: any; newVersion: any, newEnrollment: any } | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const [changeDate, setChangeDate] = useState("2025-12-31");
	const [processingCharge, setProcessingCharge] = useState(enrollmentData?.processingCharge || "0");
	const [applyNewRates, setApplyNewRates] = useState(false);

	const enrollmentFields = [
		"enrollmentId", "firstEnrollmentId", "enrollmentNo", "enrollmentDate",
		"membershipMasterId", "membershipId", "accountId", "memberId",
		"activityId", "permittedDays", "attendingStartDate", "endDate",
		"membersEnrolled", "academyEntityId", "courseId", "attendingPattern",
		"attendingPatternDays", "billingDaysSessions", "courseRateId",
		"patternDiscount", "rackPrice", "dnOrDiscount", "dnAccountId",
		"billingRate", "costToMember", "roundedAmount", "billingAmount",
		"cgstAmount", "sgstAmount", "totalDebitAmount", "openEnrollment",
		"printRemarks", "officeRemarks", "walkingName", "walkingContact",
		"memberApprovalStatus", "academyApprovalStatus", "finalTSLApproval",
		"changeNo", "previousCourseID", "processingCharge", "status"
	];

	useEffect(() => {
		const fetchData = async () => {
			if (enrollmentData) {
				setIsLoading(true);
				try {
					const result = await process7(
						enrollmentData,
						new Date(changeDate).toString(),
						"nothing here for now",
						"walkign name is here",
						"234567890",
						processingCharge,
					);
					// const result = await process1(
					// 	enrollmentData,
					// 	new Date(changeDate),
					// 	processingCharge,
					// 	applyNewRates
					// );
					setProcessedData(result);
				} catch (error) {
					console.error("Error processing enrollment data:", error);
				} finally {
					setIsLoading(false);
				}
			}
		};
		fetchData();
	}, [enrollmentData, changeDate, processingCharge, applyNewRates]);

	if (!enrollmentId) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px]">
				<p className="text-slate-500 font-medium">No enrollment data found.</p>
				<Button className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen">
				<Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
				<p className="mt-4 text-xs font-black uppercase text-slate-500 tracking-widest text-center">
					Calculating Financial Impacts...
				</p>
			</div>
		);
	}

	return (
		<div className="w-full p-4 space-y-6 bg-slate-50/30">
			{/* NEW: Workflow Process & Batch Display */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{/* Existing Enrollment Info */}
				<Card className="p-4 border-l-4 border-l-blue-500 shadow-sm bg-white">
					<div className="flex items-center gap-2 mb-2">
						<Database className="w-4 h-4 text-blue-500" />
						<h3 className="text-[11px] font-black uppercase text-slate-500">Existing Enrollment</h3>
					</div>
					<div className="space-y-1">
						<p className="text-xs font-bold text-slate-700">Process: <span className="text-blue-600">#{currentConfig?.existingEnrollment?.process}</span></p>
						<p className="text-[10px] font-black uppercase text-slate-400">
							Batch Change: <span className={currentConfig?.existingEnrollment?.batchUpdate ? "text-emerald-600" : "text-slate-400"}>
								{currentConfig?.existingEnrollment?.batchUpdate ? "Required" : "Not Required"}
							</span>
						</p>
					</div>
				</Card>

				{/* New Version Info */}
				<Card className="p-4 border-l-4 border-l-emerald-500 shadow-sm bg-white">
					<div className="flex items-center gap-2 mb-2">
						<Layers className="w-4 h-4 text-emerald-500" />
						<h3 className="text-[11px] font-black uppercase text-slate-500">New Version</h3>
					</div>
					<div className="space-y-1">
						<p className="text-xs font-bold text-slate-700">Process: <span className="text-emerald-600">#{currentConfig?.newVersion?.process}</span></p>
						<p className="text-[10px] font-black uppercase text-slate-400">
							Batch Change: <span className={currentConfig?.newVersion?.batchUpdate ? "text-emerald-600" : "text-slate-400"}>
								{currentConfig?.newVersion?.batchUpdate ? "Required" : "Not Required"}
							</span>
						</p>
					</div>
				</Card>

				{/* New Enrollment Info */}
				<Card className="p-4 border-l-4 border-l-purple-500 shadow-sm bg-white">
					<div className="flex items-center gap-2 mb-2">
						<Settings2 className="w-4 h-4 text-purple-500" />
						<h3 className="text-[11px] font-black uppercase text-slate-500">New Enrollment</h3>
					</div>
					<div className="space-y-1">
						{currentConfig?.newEnrollment ? (
							<>
								<p className="text-xs font-bold text-slate-700">Process: <span className="text-purple-600">#{currentConfig?.newEnrollment?.process}</span></p>
								<p className="text-[10px] font-black uppercase text-slate-400">
									Batch Change: <span className={currentConfig?.newEnrollment?.batchUpdate ? "text-emerald-600" : "text-slate-400"}>
										{currentConfig?.newEnrollment?.batchUpdate ? "Required" : "Not Required"}
									</span>
								</p>
							</>
						) : (
							<p className="text-xs italic text-slate-400">Not required for this action</p>
						)}
					</div>
				</Card>
			</div>

			{/* Summary Display Table */}
			<Card className="border shadow-md overflow-hidden bg-white">
				<div className="bg-slate-50 border-b px-4 py-2 flex items-center gap-2">
					<ClipboardList className="w-4 h-4 text-slate-500" />
					<span className="text-[11px] font-black uppercase text-slate-600 tracking-wider">Change Summary Snapshot</span>
				</div>
				<div className="grid grid-cols-4 divide-x divide-slate-100">
					<div className="bg-slate-50/50">
						{["Change No", "Date", "Change Type", "Change Category", "Enrollment No-Changed", "Remarks"].map((label) => (
							<div key={label} className="px-4 py-2.5 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 last:border-0 h-10 flex items-center">
								{label}
							</div>
						))}
					</div>
					<div>
						{[
							enrollmentData?.changeNo || "AUTO GENERATE",
							format(Date.now(), "dd-MMM-yyyy"),
							actionType || "N/A",
							"UPGRADE/DOWNGRADE",
							enrollmentData?.enrollmentNo || "—",
							enrollmentData?.officeRemarks || "No remarks provided"
						].map((val, idx) => (
							<div key={idx} className="px-4 py-2.5 text-xs font-bold text-slate-700 border-b border-slate-100 last:border-0 h-10 flex items-center truncate">
								{val}
							</div>
						))}
					</div>
					<div className="bg-slate-50/50">
						{["Original Bill Receivable", "Original Processing Charges", "Changed Bill Receivable", "New Bill Generated", "Balance After Changes"].map((label) => (
							<div key={label} className="px-4 py-2.5 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 last:border-0 h-10 flex items-center">
								{label}
							</div>
						))}
					</div>
					<div>
						{[
							`₹ ${enrollmentData?.totalDebitAmount || 0}`,
							`₹ ${enrollmentData?.processingCharge || 0}`,
							`₹ ${processedData?.newVersion?.totalDebitAmount || 0}`,
							`₹ ${processedData?.newEnrollment?.totalDebitAmount || 0}`,
							`₹ ${(Number(processedData?.newVersion?.totalDebitAmount || 0) + Number(processedData?.newEnrollment?.totalDebitAmount || 0) + Number(processingCharge)).toFixed(2)}`
						].map((val, idx) => (
							<div key={idx} className={`px-4 py-2.5 text-xs font-black border-b border-slate-100 last:border-0 h-10 flex items-center ${idx === 4 ? 'text-blue-600 bg-blue-50/30' : 'text-slate-700'}`}>
								{val}
							</div>
						))}
					</div>
				</div>
			</Card>

			{/* Header and Action Controls */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
						<ChevronLeft className="w-5 h-5" />
					</Button>
					<div>
						<h1 className="text-xl font-black uppercase tracking-tight">{actionType?.replace('_', ' ')}</h1>
						<p className="text-xs text-slate-500 font-bold tracking-wide">ENROLLMENT ID: #{enrollmentId}</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
					<div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-md border border-slate-100">
						<Checkbox
							id="newRates"
							checked={applyNewRates}
							onCheckedChange={(checked) => setApplyNewRates(!!checked)}
						/>
						<label htmlFor="newRates" className="text-xs font-black uppercase text-slate-600 cursor-pointer flex items-center gap-1">
							<Percent className="w-3 h-3" /> Apply New Rates
						</label>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
							<Calendar className="w-3 h-3" /> Change Date
						</label>
						<Input
							type="date"
							className="h-9 text-sm w-40 font-medium"
							value={changeDate}
							onChange={(e) => setChangeDate(e.target.value)}
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
							<IndianRupee className="w-3 h-3" /> Processing Charge
						</label>
						<Input
							type="number"
							className="h-9 text-sm w-32 font-medium"
							value={processingCharge}
							onChange={(e) => setProcessingCharge(e.target.value)}
						/>
					</div>

					<Button className="bg-blue-700 hover:bg-blue-800 font-black uppercase text-xs px-8 h-10 self-end shadow-md">
						<Save className="w-4 h-4 mr-2" /> Save Changes
					</Button>
				</div>
			</div>

			{/* Main Data Table */}
			<Card className="border shadow-xl overflow-hidden bg-white">
				<div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
					<TrendingUp className="w-4 h-4 text-blue-400" />
					<span className="text-[11px] font-black uppercase text-white tracking-widest">Detailed Field Comparison</span>
				</div>
				<Table>
					<TableHeader className="bg-slate-800 hover:bg-slate-800">
						<TableRow className="hover:bg-transparent border-none">
							<TableHead className="text-white font-black uppercase text-[10px] h-12">Field Property</TableHead>
							<TableHead className="text-white font-black uppercase text-[10px]">Existing Data</TableHead>
							<TableHead className="text-blue-400 font-black uppercase text-[10px]">Modification</TableHead>
							<TableHead className="text-emerald-400 font-black uppercase text-[10px]">New Version</TableHead>
							<TableHead className="text-purple-400 font-black uppercase text-[10px]">New Enrollment</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{enrollmentFields.map((field) => (
							<TableRow key={field} className="hover:bg-slate-50/80 border-slate-100 transition-colors">
								<TableCell className="font-mono text-[10px] font-bold text-slate-400 py-2">
									{field}
								</TableCell>
								<TableCell className="text-xs font-semibold text-slate-700 bg-slate-50/40">
									{enrollmentData?.[field] !== null && enrollmentData?.[field] !== undefined
										? String(enrollmentData[field])
										: "—"}
								</TableCell>
								<TableCell className="text-xs font-bold text-blue-600">
									{processedData?.modify?.[field] ?? "—"}
								</TableCell>
								<TableCell className="text-xs font-bold text-emerald-600">
									{processedData?.newVersion?.[field] ?? "—"}
								</TableCell>
								<TableCell className="text-xs font-bold text-purple-600">
									{processedData?.newEnrollment?.[field] ?? "—"}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>
		</div>
	);
};

export default ChangeEnrollment;