import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Info, Activity } from "lucide-react";

const ChangeEnrollment = () => {
	const location = useLocation();
	const navigate = useNavigate();

	// Extract the state passed from the EnrollmentActionModal
	const { enrollmentId, actionType, enrollmentData } = location.state || {};

	// Safety check: if someone tries to access this page directly without data
	if (!enrollmentId) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
				<p className="text-slate-500 font-medium">No enrollment data found.</p>
				<Button onClick={() => navigate(-1)}>Go Back</Button>
			</div>
		);
	}

	return (
		<div className="p-6 max-w-4xl mx-auto space-y-6">
			{/* Header with Back Button */}
			<div className="flex items-center gap-4 mb-8">
				<Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
					<ChevronLeft className="w-5 h-5" />
				</Button>
				<div>
					<h1 className="text-2xl font-black uppercase tracking-tight">
						Management: {actionType?.replace('_', ' ')}
					</h1>
					<p className="text-sm text-slate-500">Processing changes for ID #{enrollmentId}</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* 1. Action Summary Card */}
				<Card className="md:col-span-2 border-none shadow-lg">
					<CardHeader className="bg-slate-50/50 border-b">
						<CardTitle className="text-sm font-black uppercase flex items-center gap-2">
							<Activity className="w-4 h-4 text-blue-600" />
							Target Action
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-6">
						<div className="p-4 rounded-lg bg-blue-50 border border-blue-100 mb-4">
							<p className="text-xs font-black text-blue-800 uppercase mb-1">Requested Modification</p>
							<p className="text-lg font-bold text-blue-900 capitalize">
								{actionType?.replace('_', ' ')}
							</p>
						</div>

						{/* Example of how to use enrollmentData */}
						<div className="space-y-3">
							<div className="flex justify-between text-sm border-b pb-2">
								<span className="text-slate-500">Current Course:</span>
								<span className="font-bold">{enrollmentData?.course?.courseName || enrollmentData?.courseName}</span>
							</div>
							<div className="flex justify-between text-sm border-b pb-2">
								<span className="text-slate-500">Current Status:</span>
								<Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[10px]">
									{enrollmentData?.status}
								</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* 2. Quick Info Sidebar */}
				<Card className="border-none shadow-md bg-slate-900 text-white">
					<CardHeader>
						<CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
							<Info className="w-4 h-4 text-blue-400" />
							Member Info
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<p className="text-[10px] text-slate-400 uppercase font-black">Full Name</p>
							<p className="text-sm font-bold">
								{enrollmentData?.member?.memberFirstName} {enrollmentData?.member?.memberLastName}
							</p>
						</div>
						<div>
							<p className="text-[10px] text-slate-400 uppercase font-black">Enrollment No</p>
							<p className="text-sm font-mono font-bold">#{enrollmentData?.enrollmentNo}</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Debugging: View all data passed (Remove in production) */}
			<div className="mt-12 p-4 bg-slate-100 rounded-lg">
				<p className="text-[10px] font-black uppercase text-slate-400 mb-2">Raw Internal State (Dev Only)</p>
				<pre className="text-[10px] overflow-auto max-h-40">
					{JSON.stringify(location.state, null, 2)}
				</pre>
			</div>
		</div>
	);
};

export default ChangeEnrollment;