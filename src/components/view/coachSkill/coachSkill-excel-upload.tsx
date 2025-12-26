import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createCoachSkill } from '@/api/coachSkill.api';
import type { CoachSkill } from '@/types/coachSkill';

interface CoachSkillExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface CoachSkillImportRow {
	memberId: number | string;
	activityId: number | string;
	experience: string;
	activityQualification?: string;
	currentlyInterest?: string;
	currentlyInTeam?: string;
	wantsUsToManageBookings?: string | boolean;
	detailsOfChargesExpected?: string;
	detailsOfServicesAvailable?: string;
	status?: string;
}

export default function CoachSkillExcelUpload({
	isOpen,
	onClose,
	onSuccess
}: CoachSkillExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'memberId',
		'activityId',
		'experience',
		'activityQualification',
		'currentlyInterest',
		'currentlyInTeam',
		'wantsUsToManageBookings',
		'detailsOfChargesExpected',
		'detailsOfServicesAvailable',
		'status'
	], []);

	const handleValidateRow = useCallback((row: CoachSkillImportRow) => {
		if (!row.memberId || isNaN(Number(row.memberId))) return "Valid Member ID is required";
		if (!row.activityId || isNaN(Number(row.activityId))) return "Valid Activity ID is required";
		if (!row.experience) return "Experience is required";

		const validStatuses = ['active', 'inactive', 'pending'];
		if (row.status && !validStatuses.includes(row.status.toLowerCase())) {
			return "Status must be active, inactive, or pending";
		}

		return null;
	}, []);

	const handleCreateCoachSkill = useCallback(async (row: CoachSkillImportRow) => {
		const manageBookings = typeof row.wantsUsToManageBookings === 'string'
			? row.wantsUsToManageBookings.toLowerCase() === 'true' || row.wantsUsToManageBookings === '1'
			: Boolean(row.wantsUsToManageBookings);

		const payload: Omit<CoachSkill, 'coachSkillId' | 'createdAt' | 'updatedAt' | 'memberFirstName' | 'memberLastName' | 'activityName'> = {
			memberId: Number(row.memberId),
			activityId: Number(row.activityId),
			experience: String(row.experience),
			activityQualification: row.activityQualification || "",
			currentlyInterest: row.currentlyInterest || "",
			currentlyInTeam: row.currentlyInTeam || "",
			wantsUsToManageBookings: manageBookings,
			detailsOfChargesExpected: row.detailsOfChargesExpected || "",
			detailsOfServicesAvailable: row.detailsOfServicesAvailable || "",
			status: row.status?.toLowerCase() || "active",
		};

		await createCoachSkill(payload);
		console.log(`✅ Imported Skill: Member ${payload.memberId} for Activity ${payload.activityId}`);
	}, []);

	return (
		<AnimatePresence>
			{isOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
					role="dialog"
					aria-modal="true"
				>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="absolute inset-0 bg-black/60 backdrop-blur-sm"
					/>

					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						className="relative w-full max-w-5xl h-[75vh] bg-white dark:bg-slate-950 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800"
					>
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950">
							<div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
									Bulk Import Coach Skills
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Upload an Excel file to assign activities and qualifications to coaches.
								</p>
							</div>
							<button
								onClick={onClose}
								className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="flex-1 overflow-hidden p-6 bg-gray-50 dark:bg-slate-900/50">
							<ExcelUpload<CoachSkillImportRow>
								title="Coach Skill Mapping Master"
								expectedColumns={expectedColumns}
								createFunction={handleCreateCoachSkill}
								validateRow={handleValidateRow}
								onUploadComplete={() => {
									onSuccess();
									onClose();
								}}
							/>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}