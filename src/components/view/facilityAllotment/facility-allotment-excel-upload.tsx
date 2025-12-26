import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createFacilityAllotment } from '@/api/facilityAllotment.api';

interface FacilityAllotmentExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface FacilityAllotmentImportRow {
	facilityId: number | string;
	areaId?: number | string;
	batchId: number | string;
	level: number;
	assignmentDate?: string | number;
	unAssignmentDate?: string | number;
	status?: string;
}

export default function FacilityAllotmentExcelUpload({ isOpen, onClose, onSuccess }: FacilityAllotmentExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'facilityId',
		'areaId',
		'batchId',
		'level',
		'assignmentDate',
		'unAssignmentDate',
		'status'
	], []);

	const handleValidateRow = useCallback((row: FacilityAllotmentImportRow) => {
		if (!row.facilityId || isNaN(Number(row.facilityId))) return "Valid Facility ID is required";
		if (!row.batchId || isNaN(Number(row.batchId))) return "Valid Batch ID is required";

		if (row.areaId && isNaN(Number(row.areaId))) return "Area ID must be a number";

		return null;
	}, []);

	const handleCreateAllotment = useCallback(async (row: FacilityAllotmentImportRow) => {
		const payload = {
			facilityId: Number(row.facilityId),
			areaId: row.areaId ? Number(row.areaId) : null,
			batchId: Number(row.batchId),
			level: Number(row.level),

			assignmentDate: row.assignmentDate ? new Date(row.assignmentDate).toISOString() : new Date().toISOString(),
			unAssignmentDate: row.unAssignmentDate ? new Date(row.unAssignmentDate).toISOString() : null,

			status: row.status || 'active',
		};

		await createFacilityAllotment(payload);
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
									Bulk Allot Facilities
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Assign batches to specific areas and facilities for scheduled training.
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
							<ExcelUpload<FacilityAllotmentImportRow>
								title="Facility Allotment Master"
								expectedColumns={expectedColumns}
								createFunction={handleCreateAllotment}
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