import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createCoachAssignment } from '@/api/coachAssignment.api';
import type { CoachAssignment } from '@/types/coachAssignment';

interface CoachAssignmentExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface CoachAssignmentImportRow {
	accountMemberId: number | string;
	batchId: number | string;
	designation?: string;
	responsibilities?: string;
	cost?: number | string;
	startDate?: string;
	endDate?: string;
	remarks?: string;
	status?: string;
	createdBy?: number | string;
	createdAt?: string;
	updatedAt?: string;
}

export default function CoachAssignmentExcelUpload({
	isOpen,
	onClose,
	onSuccess,
}: CoachAssignmentExcelUploadProps) {

	const expectedColumns = useMemo(
		() => [
			'accountMemberId',
			'batchId',
			'designation',
			'responsibilities',
			'cost',
			'startDate',
			'endDate',
			'remarks',
			'status',
			'createdBy',
			'createdAt',
			'updatedAt',
		],
		[]
	);

	const handleValidateRow = useCallback((row: CoachAssignmentImportRow) => {
		if (!row.accountMemberId || isNaN(Number(row.accountMemberId))) {
			return 'Valid Account Member ID is required';
		}

		if (!row.batchId || isNaN(Number(row.batchId))) {
			return 'Valid Batch ID is required';
		}

		if (row.cost && isNaN(Number(row.cost))) {
			return 'Cost must be a number';
		}

		if (row.createdBy && isNaN(Number(row.createdBy))) {
			return 'Created By must be a number';
		}

		return null;
	}, []);

	const handleCreateCoachAssignment = useCallback(
		async (row: CoachAssignmentImportRow) => {
			const payload: CoachAssignment = {
				accountMemberId: Number(row.accountMemberId),
				batchId: Number(row.batchId),
				designation: row.designation || '',
				responsibilities: row.responsibilities || '',
				cost: row.cost ? Math.floor(Number(row.cost)) : undefined,
				startDate: row.startDate ? new Date(row.startDate) : undefined,
				endDate: row.endDate ? new Date(row.endDate) : undefined,
				remarks: row.remarks || '',
				status: row.status || 'Active',
				createdBy: row.createdBy ? Number(row.createdBy) : undefined,
				createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
				updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
			};

			await createCoachAssignment(payload);
		},
		[]
	);

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
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
							<div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
									Bulk Import Coach Assignments
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Assign coaches to batches using Excel upload.
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
							<ExcelUpload<CoachAssignmentImportRow>
								title="Coach Assignment Master"
								expectedColumns={expectedColumns}
								createFunction={handleCreateCoachAssignment}
								validateRow={handleValidateRow}
								onUploadComplete={onSuccess}
							/>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}
