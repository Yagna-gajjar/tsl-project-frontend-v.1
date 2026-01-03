import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"; // Assuming Shadcn Checkbox
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/components/ui/table";
import { ChevronLeft, Save, Loader2, Calendar, IndianRupee, Percent } from "lucide-react";

// Helper Import
import { process1 } from "@/helpers/enrollment-change/process1";

const ChangeEnrollment = () => {
	const location = useLocation();
	const navigate = useNavigate();

	// Extract the state passed from the EnrollmentActionModal
	const { enrollmentId, actionType, enrollmentData } = location.state || {};
	const [value1, setValue1] = useState(enrollmentData?.totalDebitAmount);

	// 1. Component States
	const [processedData, setProcessedData] = useState<{ modify: any; newVersion: any, newEnrollment: any } | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// 2. Custom Input States
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
					// Added applyNewRates as the 4th parameter
					const result = await process1(
						enrollmentData,
						new Date(changeDate),
						processingCharge,
						applyNewRates
					);
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
					Updating Calculations...
				</p>
			</div>
		);
	}

	return (
		<div className="w-full p-4 space-y-6">
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
					{/* Checkbox: Apply New Rates */}
					<div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-md border border-slate-100">
						<Checkbox
							id="newRates"
							checked={applyNewRates}
							onCheckedChange={(checked) => setApplyNewRates(!!checked)}
						/>
						<label
							htmlFor="newRates"
							className="text-xs font-black uppercase text-slate-600 cursor-pointer select-none flex items-center gap-1"
						>
							<Percent className="w-3 h-3" /> Apply New Rates
						</label>
					</div>

					{/* Input Field: Date */}
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

					{/* Input Field: Processing Charge */}
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
				<Table>
					<TableHeader className="bg-slate-900 hover:bg-slate-900">
						<TableRow className="hover:bg-transparent border-none">
							<TableHead className="text-white font-black uppercase text-[11px] h-14">Field Property</TableHead>
							<TableHead className="text-white font-black uppercase text-[11px]">Existing Data</TableHead>
							<TableHead className="text-blue-400 font-black uppercase text-[11px]">Modification</TableHead>
							<TableHead className="text-emerald-400 font-black uppercase text-[11px]">New Version</TableHead>
							<TableHead className="text-purple-400 font-black uppercase text-[11px]">New Enrollment</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{enrollmentFields.map((field) => (
							<TableRow key={field} className="hover:bg-slate-50/80 border-slate-100 transition-colors">
								<TableCell className="font-mono text-[10px] font-bold text-slate-400">
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