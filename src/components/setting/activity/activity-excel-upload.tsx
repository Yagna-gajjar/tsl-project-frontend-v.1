import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createActivity } from '@/api/activity.api';

interface ActivityExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface ActivityImportRow {
	activityName: string;
	activityType: string;
	description?: string;
	cgst?: number | string;
	sgst?: number | string;
	srgst?: number | string;
	status?: string;
}

export default function ActivityExcelUpload({ isOpen, onClose, onSuccess }: ActivityExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'activityName',
		'activityType',
		'description',
		'cgst',
		'sgst',
		'srgst',
		'status'
	], []);

	const handleValidateRow = useCallback((row: ActivityImportRow) => {
		if (!row.activityName) return "Activity Name is required";
		if (!row.activityType) return "Activity Type is required";

		// Validate tax fields are numeric if provided
		if (row.cgst && isNaN(Number(row.cgst))) return "CGST must be a number";
		if (row.sgst && isNaN(Number(row.sgst))) return "SGST must be a number";
		if (row.srgst && isNaN(Number(row.srgst))) return "SRGST must be a number";

		return null;
	}, []);

	const handleCreateActivity = useCallback(async (row: ActivityImportRow) => {
		const payload = {
			activityName: row.activityName,
			activityType: row.activityType,
			description: row.description || "",

			// Casting tax percentages to INT as per SQL schema
			cgst: row.cgst ? Math.round(Number(row.cgst)) : 0,
			sgst: row.sgst ? Math.round(Number(row.sgst)) : 0,
			srgst: row.srgst ? Math.round(Number(row.srgst)) : 0,

			// Default status 'create' if not specified
			status: row.status || 'create'
		};

		await createActivity(payload);
		console.log(`✅ Imported Activity: ${payload.activityName}`);
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
						{/* Header */}
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950">
							<div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
									Bulk Import Activities
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Upload sports, training sessions, or facility activities.
								</p>
							</div>
							<button
								onClick={onClose}
								className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Excel Upload Body */}
						<div className="flex-1 overflow-hidden p-6 bg-gray-50 dark:bg-slate-900/50">
							<ExcelUpload<ActivityImportRow>
								title="Activity Master List"
								expectedColumns={expectedColumns}
								createFunction={handleCreateActivity}
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