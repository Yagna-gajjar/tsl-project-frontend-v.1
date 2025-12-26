import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createBatch } from '@/api/batch.api';
import type { Batch } from '@/types/batch';

interface BatchExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface BatchImportRow {
	batchName: string;
	courseId: number | string;
	entityId: number | string;
	activityId?: string;
	membershipMasterId?: number | string;
	batchType?: string;
	startTime: string;
	endTime: string;
	introduceDate: string | number;
	maxCapacity?: number | string;
	sessionMinutes?: number | string;
	daysPerWeek?: number | string;
	daysPattern?: string;
	status?: string;
}

export default function BatchExcelUpload({ isOpen, onClose, onSuccess }: BatchExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'batchName',
		'courseId',
		'entityId',
		'activityId',
		'membershipMasterId',
		'batchType',
		'startTime',
		'endTime',
		'introduceDate',
		'maxCapacity',
		'sessionMinutes',
		'daysPerWeek',
		'daysPattern',
		'status'
	], []);

	const handleValidateRow = useCallback((row: BatchImportRow) => {
		if (!row.batchName) return "Batch Name is required";
		if (!row.entityId || isNaN(Number(row.entityId))) return "Valid Entity ID is required";
		if (!row.startTime) return "Start Time is required";
		if (!row.endTime) return "End Time is required";

		if (row.maxCapacity && isNaN(Number(row.maxCapacity))) return "Max Capacity must be a number";

		return null;
	}, []);

	const handleCreateBatch = useCallback(async (row: BatchImportRow) => {
		const payload: Batch = {
			batchType: row.batchType || null,
			entityId: Number(row.entityId),
			activityId: Number(row.activityId) || null,
			membershipMasterId: row.membershipMasterId ? Number(row.membershipMasterId) : null,
			courseId: row.courseId ? Number(row.courseId) : null,
			batchName: row.batchName,
			startTime: row.startTime,
			endTime: row.endTime,
			sessionMinutes: row.sessionMinutes ? Number(row.sessionMinutes) : 60,
			daysPerWeek: row.daysPerWeek ? Number(row.daysPerWeek) : 1,
			daysPattern: row.daysPattern || "",
			maxCapacity: row.maxCapacity ? Number(row.maxCapacity) : 1,
			introduceDate: new Date(row.introduceDate),
			status: (row.status?.toLowerCase() as any) || "active",
		};

		await createBatch(payload as Batch);
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
									Bulk Import Batches
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Upload an Excel file to create multiple training batches at once.
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
							<ExcelUpload<BatchImportRow>
								title="Batch Master Import"
								expectedColumns={expectedColumns}
								createFunction={handleCreateBatch}
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