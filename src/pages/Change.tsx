import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ENROLLMENT_WORKFLOW_CONFIG } from "@/helpers/enrollment-change/workflow";
import { process1 } from "@/helpers/enrollment-change/process1";
import { process2 } from "@/helpers/enrollment-change/process2";
import { process3 } from "@/helpers/enrollment-change/process3";
import { process4 } from "@/helpers/enrollment-change/process4";
import { process5 } from "@/helpers/enrollment-change/process5";
import { process6 } from "@/helpers/enrollment-change/process6";
import { process7 } from "@/helpers/enrollment-change/process7";
import { process8 } from "@/helpers/enrollment-change/process8";
import { process9 } from "@/helpers/enrollment-change/process9";
import { process10 } from "@/helpers/enrollment-change/process10";


const ChangeEnrollment = () => {
	const location = useLocation();
	const navigate = useNavigate();

	const { enrollmentId, actionType, enrollmentData } = location.state || {};

	const currentConfig = ENROLLMENT_WORKFLOW_CONFIG[actionType];

	const [processedData, setProcessedData] = useState<{ modify: any; newVersion: any, newEnrollment: any } | null | any>(null);
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

	const PROCESSES = [
		() => process1(
			enrollmentData,
			new Date(changeDate),
			processingCharge,
			applyNewRates
		),
		() => process2(
			enrollmentData,
			new Date(changeDate).toString(),
			"",
			"walkingName",
			"1234567890",
			processingCharge
		),
		() => process3(
			enrollmentData,
			new Date(changeDate).toString(),
			"",
			"walkingName",
			"1234567890",
			processingCharge
		),
		() => process4(
			enrollmentData,
			new Date(changeDate).toString(),
			"",
			"walkingName",
			"1234567890",
			processingCharge
		),
		() => process5(
			enrollmentData,
			new Date(changeDate).toString(),
			"",
			"walkingName",
			"1234567890",
			processingCharge
		),
		() => process6(
			enrollmentData,
			new Date(changeDate).toString(),
			"",
			"walkingName",
			"1234567890",
			processingCharge
		),
		() => process7(
			enrollmentData,
			new Date(changeDate).toString(),
			"",
			"walkingName",
			"1234567890",
			processingCharge
		),
		() => process8(
			enrollmentData,
			1, // DNAccountId
			1, // DNOrDiscount
			"",
			"walkingName",
			"1234567890",

		),
		() => process9(
			enrollmentData,
			1, // DNOrDiscount,
			processingCharge,
			"changeType",
			"",
			"walkingName",
			"1234567890",
		),
		() => process10(
			enrollmentData,
			currentConfig?.existingEnrollment?.batchUpdate,
			processingCharge,
			new Date(changeDate)
		)];
	const currentProcess = PROCESSES[currentConfig.existingEnrollment.process - 1]

	useEffect(() => {
		const fetchData = async () => {
			if (enrollmentData) {
				setIsLoading(true);
				try {
					const result = await currentProcess()
					console.log(result);

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
		<div className="w-full bg-white dark:bg-slate-900 min-h-screen">
			{/* Header Section */}
			<div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700 px-6 py-3 sticky top-0 z-10">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800">
							<ChevronLeft className="w-5 h-5" />
						</Button>
						<div>
							<h1 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">{actionType?.replace('_', ' ')}</h1>
							<p className="text-xs font-bold tracking-wide text-slate-600 dark:text-slate-400">ENROLLMENT ID: #{enrollmentId}</p>
						</div>
					</div>

					<Button className="bg-blue-600 hover:bg-blue-700 font-black uppercase text-xs px-6 h-9 shadow-lg text-white">
						<Save className="w-4 h-4 mr-2" /> Save Changes
					</Button>
				</div>
			</div>

			<div className="p-3 space-y-3">
				{/* Controls Section - Compact */}
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-3 bg-slate-100 dark:bg-slate-800 p-3 rounded border border-slate-300 dark:border-slate-700">
					<div className="flex items-center gap-2 bg-slate-200/50 dark:bg-slate-700/50 px-3 py-2 rounded border border-slate-400 dark:border-slate-600">
						<Checkbox
							id="newRates"
							checked={applyNewRates}
							onCheckedChange={(checked) => setApplyNewRates(!!checked)}
						/>
						<label htmlFor="newRates" className="text-xs font-bold uppercase text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-1">
							<Percent className="w-3 h-3" /> Apply New Rates
						</label>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 flex items-center gap-1">
							<Calendar className="w-3 h-3" /> Change Date
						</label>
						<Input
							type="date"
							className="h-8 text-xs bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-medium"
							value={changeDate}
							onChange={(e) => setChangeDate(e.target.value)}
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 flex items-center gap-1">
							<IndianRupee className="w-3 h-3" /> Processing Charge
						</label>
						<Input
							type="number"
							className="h-8 text-xs bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-medium"
							value={processingCharge}
							onChange={(e) => setProcessingCharge(e.target.value)}
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Status</label>
						<div className="h-8 bg-emerald-50 dark:bg-slate-700/50 rounded border border-emerald-300 dark:border-slate-600 flex items-center px-3 text-xs font-bold text-emerald-700 dark:text-emerald-400">
							Ready to Process
						</div>
					</div>
				</div>

				{/* Workflow Info Cards - Compact Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
					{/* Existing Enrollment Info */}
					<div className="bg-slate-50 dark:bg-slate-800 border-l-4 border-l-blue-500 p-2.5 rounded border-r border-t border-b border-slate-200 dark:border-slate-700">
						<div className="flex items-center gap-2 mb-1.5">
							<Database className="w-3.5 h-3.5 text-blue-500" />
							<h3 className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300">Existing Enrollment</h3>
						</div>
						<div className="space-y-0.5 text-[11px]">
							<p className="text-slate-900 dark:text-slate-200">Process: <span className="font-bold text-blue-600 dark:text-blue-300">#{currentConfig?.existingEnrollment?.process}</span></p>
							<p className="text-slate-600 dark:text-slate-400">Batch: <span className={currentConfig?.existingEnrollment?.batchUpdate ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-slate-500"}>
								{currentConfig?.existingEnrollment?.batchUpdate ? "Required" : "Not Required"}
							</span></p>
						</div>
					</div>

					{/* New Version Info */}
					<div className="bg-slate-50 dark:bg-slate-800 border-l-4 border-l-emerald-500 p-2.5 rounded border-r border-t border-b border-slate-200 dark:border-slate-700">
						<div className="flex items-center gap-2 mb-1.5">
							<Layers className="w-3.5 h-3.5 text-emerald-500" />
							<h3 className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300">New Version</h3>
						</div>
						<div className="space-y-0.5 text-[11px]">
							<p className="text-slate-900 dark:text-slate-200">Process: <span className="font-bold text-emerald-600 dark:text-emerald-300">#{currentConfig?.newVersion?.process}</span></p>
							<p className="text-slate-600 dark:text-slate-400">Batch: <span className={currentConfig?.newVersion?.batchUpdate ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-slate-500"}>
								{currentConfig?.newVersion?.batchUpdate ? "Required" : "Not Required"}
							</span></p>
						</div>
					</div>

					{/* New Enrollment Info */}
					<div className="bg-slate-50 dark:bg-slate-800 border-l-4 border-l-purple-500 p-2.5 rounded border-r border-t border-b border-slate-200 dark:border-slate-700">
						<div className="flex items-center gap-2 mb-1.5">
							<Settings2 className="w-3.5 h-3.5 text-purple-500" />
							<h3 className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300">New Enrollment</h3>
						</div>
						<div className="space-y-0.5 text-[11px]">
							{currentConfig?.newEnrollment ? (
								<>
									<p className="text-slate-900 dark:text-slate-200">Process: <span className="font-bold text-purple-600 dark:text-purple-300">#{currentConfig?.newEnrollment?.process}</span></p>
									<p className="text-slate-600 dark:text-slate-400">Batch: <span className={currentConfig?.newEnrollment?.batchUpdate ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-slate-500"}>
										{currentConfig?.newEnrollment?.batchUpdate ? "Required" : "Not Required"}
									</span></p>
								</>
							) : (
								<p className="text-[10px] text-slate-500">Not required for this action</p>
							)}
						</div>
					</div>
				</div>

				{/* Summary Table - Compact */}
				<div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
					<div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-3 py-2 flex items-center gap-2">
						<ClipboardList className="w-3.5 h-3.5 text-blue-500" />
						<span className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Change Summary</span>
					</div>
					<div className="overflow-x-auto">
						<div className="grid grid-cols-4 divide-x divide-slate-300 dark:divide-slate-700">
							<div>
								{["Change No", "Date", "Change Type", "Category", "Enrollment No", "Remarks"].map((label) => (
									<div key={label} className="px-4 py-1.5 text-[9px] font-bold uppercase text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/40 last:border-0 h-8 flex items-center">
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
									enrollmentData?.officeRemarks || "No remarks"
								].map((val, idx) => (
									<div key={idx} className="px-4 py-1.5 text-[11px] font-semibold border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 last:border-0 h-8 flex items-center truncate">
										{val}
									</div>
								))}
							</div>
							<div>
								{["Original Bill", "Processing Charge", "Changed Bill", "New Bill", "Balance"].map((label) => (
									<div key={label} className="px-4 py-1.5 text-[9px] font-bold uppercase text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/40 last:border-0 h-8 flex items-center">
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
									<div key={idx} className={`px-4 py-1.5 text-[11px] font-bold border-b border-slate-200 dark:border-slate-700 last:border-0 h-8 flex items-center ${idx === 4 ? 'text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-800 dark:text-slate-200'}`}>
										{val}
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Main Data Table */}
				<div className="bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
					<div className="bg-slate-100 dark:bg-slate-900 px-3 py-2 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
						<TrendingUp className="w-3.5 h-3.5 text-blue-500" />
						<span className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Detailed Field Comparison</span>
					</div>
					<div className="overflow-x-auto">
						<div className="grid grid-cols-5 divide-x divide-slate-300 dark:divide-slate-700">
							{/* Field Property Header and Values - Wider */}
							<div>
								<div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-2.5 text-[9px] font-bold uppercase text-slate-700 dark:text-slate-400 h-10 flex items-center">
									Field Property
								</div>
								{enrollmentFields.map((field, idx) => (
									<div key={field} className={`px-4 py-2 text-[10px] font-mono font-semibold border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 min-h-10 flex items-center ${idx % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/40' : 'bg-white dark:bg-slate-800'}`}>
										{field}
									</div>
								))}
							</div>

							{/* Existing Data */}
							<div>
								<div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-3 py-2.5 text-[9px] font-bold uppercase text-slate-700 dark:text-slate-400 h-10 flex items-center">
									Existing Data
								</div>
								{enrollmentFields.map((field, idx) => (
									<div key={field} className={`px-3 py-2 text-[10px] font-semibold border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 min-h-10 flex items-center ${idx % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/40' : 'bg-white dark:bg-slate-800'}`}>
										{enrollmentData?.[field] !== null && enrollmentData?.[field] !== undefined
											? String(enrollmentData[field])
											: "—"}
									</div>
								))}
							</div>

							{/* Modification */}
							<div>
								<div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-3 py-2.5 text-[9px] font-bold uppercase text-blue-600 dark:text-blue-300 h-10 flex items-center">
									Modification
								</div>
								{enrollmentFields.map((field, idx) => (
									<div key={field} className={`px-3 py-2 text-[10px] font-bold border-b border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 min-h-10 flex items-center ${idx % 2 === 0 ? 'bg-blue-50/30 dark:bg-slate-800/40' : 'bg-blue-50/10 dark:bg-slate-800'}`}>
										{processedData?.modify?.[field] ?? "—"}
									</div>
								))}
							</div>

							{/* New Version */}
							<div>
								<div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-3 py-2.5 text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-300 h-10 flex items-center">
									New Version
								</div>
								{enrollmentFields.map((field, idx) => (
									<div key={field} className={`px-3 py-2 text-[10px] font-bold border-b border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 min-h-10 flex items-center ${idx % 2 === 0 ? 'bg-emerald-50/30 dark:bg-slate-800/40' : 'bg-emerald-50/10 dark:bg-slate-800'}`}>
										{processedData?.newVersion?.[field] ?? "—"}
									</div>
								))}
							</div>

							{/* New Enrollment */}
							<div>
								<div className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-3 py-2.5 text-[9px] font-bold uppercase text-purple-600 dark:text-purple-300 h-10 flex items-center">
									New Enrollment
								</div>
								{enrollmentFields.map((field, idx) => (
									<div key={field} className={`px-3 py-2 text-[10px] font-bold border-b border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-400 min-h-10 flex items-center ${idx % 2 === 0 ? 'bg-purple-50/30 dark:bg-slate-800/40' : 'bg-purple-50/10 dark:bg-slate-800'}`}>
										{processedData?.newEnrollment?.[field] ?? "—"}
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ChangeEnrollment;
