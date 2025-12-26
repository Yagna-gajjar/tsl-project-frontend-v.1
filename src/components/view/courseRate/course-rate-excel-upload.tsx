import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createCourseRate } from '@/api/courseRate.api';
import type { CourseRate } from '@/types/courseRate';

interface CourseRateExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface CourseRateImportRow {
	courseId: number | string;
	membershipMasterId?: number | string;
	aboveUnits: number | string;
	unitRate: number | string;
	introduceDate?: string | number;
	suspensionDate?: string | number;
	enrChangesAllowed?: number | string;
	enrFreezingAllowed?: number | string;
	minDaysInEnr?: number | string;
	daySelection?: string | boolean | number;
	discountOnDayReduce?: number | string;
	status?: string;
}

export default function CourseRateExcelUpload({ isOpen, onClose, onSuccess }: CourseRateExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'courseId',
		'membershipMasterId',
		'aboveUnits',
		'unitRate',
		'introduceDate',
		'suspendedDate',
		'enrChangesAllowed',
		'enrFreezingAllowed',
		'minDaysInEnr',
		'daysSelection',
		'discountOnDayReduce',
		'status'
	], []);

	const handleValidateRow = useCallback((row: CourseRateImportRow) => {
		if (!row.courseId || isNaN(Number(row.courseId))) return "Valid Course ID is required";

		if (row.aboveUnits === undefined || isNaN(Number(row.aboveUnits))) return "Above Units is required (default 0)";
		if (row.unitRate === undefined || isNaN(Number(row.unitRate))) return "Unit Rate is required";

		if (row.membershipMasterId && isNaN(Number(row.membershipMasterId))) {
			return "Membership Master ID must be a number";
		}

		return null;
	}, []);

	const handleCreateRate = useCallback(async (row: CourseRateImportRow) => {
		// const parseBool = (val: any) => {
		// 	if (typeof val === 'boolean') return val;
		// 	const s = String(val).toLowerCase();
		// 	return s === 'true' || s === '1' || s === 'yes';
		// };

		const payload: CourseRate = {
			courseId: Number(row.courseId),
			membershipMasterId: row.membershipMasterId ? Number(row.membershipMasterId) : undefined,

			aboveUnits: Math.floor(Number(row.aboveUnits || 0)),
			unitRate: Math.floor(Number(row.unitRate)),

			introduceDate: row.introduceDate ? new Date(row.introduceDate).toISOString() : new Date().toISOString(),
			suspensionDate: row.suspensionDate ? new Date(row.suspensionDate).toISOString() : undefined,

			enrChangesAllowed: Number(row.enrChangesAllowed || 0),
			enrFreezingAllowed: Number(row.enrFreezingAllowed || 0),
			minDaysInEnr: Number(row.minDaysInEnr || 0),
			daySelection: row.daySelection as any,
			discountOnDayReduce: Number(row.discountOnDayReduce || 0),

			status: row.status || 'active',
		};

		await createCourseRate(payload);
		console.log(`✅ Imported Rate: ${payload.unitRate} for Course ${payload.courseId}`);
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
						className="relative w-full max-w-6xl h-[85vh] bg-white dark:bg-slate-950 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800"
					>
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950">
							<div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
									Bulk Import Course Rates
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Configure tiered pricing, unit rates, and enrollment flexibility rules.
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
							<ExcelUpload<CourseRateImportRow>
								title="Pricing & Policy Master"
								expectedColumns={expectedColumns}
								createFunction={handleCreateRate}
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