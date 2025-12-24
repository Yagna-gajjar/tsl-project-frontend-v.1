import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createCourseShare } from '@/api/courseShare.api';
import type { CourseShare } from '@/types/courseShare';

interface CourseShareExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface CourseShareImportRow {
	roleInCourse?: string;
	courseId: number | string;
	accountId: number | string; // changed from entityId
	share: number | string;
	cgst: number | string;
	sgst: number | string;
	approvalAuthorityId?: number | string;
	status?: string;
	createdBy?: number | string;
}

export default function CourseShareExcelUpload({ isOpen, onClose, onSuccess }: CourseShareExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'roleInCourse',
		'courseId',
		'accountId', // updated
		'share',
		'cgst',
		'sgst',
		'approvalAuthorityId',
		'status',
		'createdBy'
	], []);

	const handleValidateRow = useCallback((row: CourseShareImportRow) => {
		if (!row.courseId || isNaN(Number(row.courseId))) return "Valid Course ID is required";
		if (!row.accountId || isNaN(Number(row.accountId))) return "Valid Account ID is required";

		// if (row.share === undefined || isNaN(Number(row.share))) return "Share percentage is required";
		// if (row.cgst === undefined || isNaN(Number(row.cgst))) return "CGST is required";
		// if (row.sgst === undefined || isNaN(Number(row.sgst))) return "SGST is required";

		return null;
	}, []);

	const handleCreateShare = useCallback(async (row: CourseShareImportRow) => {
		const payload: CourseShare = {
			roleInCourse: row.roleInCourse || 'Partner',
			courseId: Number(row.courseId),
			accountId: Number(row.accountId),

			share: Number(row.share),
			cgst: Number(row.cgst),
			sgst: Number(row.sgst),

			approvalAuthorityId: row.approvalAuthorityId ? Number(row.approvalAuthorityId) : undefined,
			status: row.status || 'active',
			createdBy: row.createdBy ? Number(row.createdBy) : undefined
		};

		await createCourseShare(payload);
		console.log(`✅ Imported Share for Account ${payload.accountId} on Course ${payload.courseId}`);
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
						className="relative w-full max-w-5xl h-[80vh] bg-white dark:bg-slate-950 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800"
					>
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950">
							<div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
									Bulk Import Course Shares
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Define revenue split and tax configurations between accounts and courses.
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
							<ExcelUpload<CourseShareImportRow>
								title="Revenue Share Mapping"
								expectedColumns={expectedColumns}
								createFunction={handleCreateShare}
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