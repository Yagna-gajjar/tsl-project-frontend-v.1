import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createCoursePackage } from '@/api/coursePackage.api';
import type { CoursePackage } from '@/types/coursePackage';

interface CoursePackageExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface CoursePackageImportRow {
	courseId: number | string;
	linkType: string;
	batchId: number;
	approvalAuthorityId?: number | string;
	status?: string;
}

export default function CoursePackageExcelUpload({ isOpen, onClose, onSuccess }: CoursePackageExcelUploadProps) {
	const expectedColumns = useMemo(() => [
		'courseId',
		'linkType',
		'batchId',
		'approvalAuthorityId',
		'status'
	], []);

	const handleValidateRow = useCallback((row: CoursePackageImportRow) => {
		if (!row.courseId || isNaN(Number(row.courseId))) return "Valid Course ID is required";
		// if (!row.batchId || isNaN(Number(row.batchId))) return "Valid Batch ID is required";
		if (!row.linkType) return "Link Type (e.g., 'Primary', 'Optional') is required";

		if (row.approvalAuthorityId && isNaN(Number(row.approvalAuthorityId))) {
			return "Approval Authority ID must be a number";
		}

		return null;
	}, []);

	const handleCreatePackage = useCallback(async (row: CoursePackageImportRow) => {
		const payload: CoursePackage = {
			courseId: Number(row.courseId),
			linkType: row.linkType,
			batchId: row.batchId ? Number(row.batchId) : null,
			approvalAuthorityId: row.approvalAuthorityId ? Number(row.approvalAuthorityId) : undefined,
			status: row.status || 'active',
		};

		await createCoursePackage(payload);
		console.log(`✅ Linked Course ${payload.courseId} to Batch ${payload.batchId} as ${payload.linkType}`);
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
									Bulk Import Course Packages
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Map courses to batches and assign approval authorities.
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
							<ExcelUpload<CoursePackageImportRow>
								title="Course Package Mapping"
								expectedColumns={expectedColumns}
								createFunction={handleCreatePackage}
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