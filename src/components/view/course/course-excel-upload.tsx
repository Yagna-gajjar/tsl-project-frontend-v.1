import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createCourse } from '@/api/course.api';
import type { Course } from '@/types/course';

interface CourseExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface CourseImportRow {
	// Basic Info
	courseName: string;
	courseType: string;
	classification: string;
	status: string;

	// Dates & Times
	introduceDate?: string | number;
	suspensionDate?: string | number;
	avbFrom?: string; // TIME
	avbTo?: string;   // TIME

	// Pattern & Logic
	chargingPattern: string;
	sessionMinutes: number | string;
	noOfDaysInWeek: number | string;
	daysPattern: string;
	unitsMultipleOf?: number | string;

	// Capacity & Restrictions
	batchCapacity: number | string;
	totalParallelBatches: number | string;
	maxPerson?: number | string;
	minAge: number | string;
	maxAge: number | string;
	gender: 'A' | 'F' | 'O' | 'M';

	// Financials & IDs
	entityId: number | string;
	activityId: number | string;
	balanceUsable?: string;
	enrApprovalRequired?: string | boolean | number;
	cgstRate?: number | string;
	sgstRate?: number | string;
	createdBy?: number | string;
}

export default function CourseExcelUpload({ isOpen, onClose, onSuccess }: CourseExcelUploadProps) {

	// Strictly aligned with your SQL Schema columns
	const expectedColumns = useMemo(() => [
		'courseName', 'courseType', 'classification', 'introduceDate', 'suspensionDate',
		'chargingPattern', 'avbFrom', 'avbTo', 'sessionMinutes', 'noOfDaysInWeek',
		'daysPattern', 'unitsMultipleOf', 'batchCapacity', 'totalParallelBatches',
		'maxPerson', 'minAge', 'maxAge', 'gender', 'balanceUsable', 'entityId',
		'activityId', 'enrApprovalRequired', 'sgstRate', 'cgstRate', 'status', 'createdBy'
	], []);

	const handleValidateRow = useCallback((row: CourseImportRow) => {
		// Mandatory Fields per Schema (NOT NULL)
		if (!row.courseName) return "Course Name is required";
		if (!row.daysPattern) return "Days Pattern is required";
		if (!row.entityId || isNaN(Number(row.entityId))) return "Entity ID must be a valid number";
		if (!row.activityId || isNaN(Number(row.activityId))) return "Activity ID must be a valid number";

		// CHECK Constraints
		// const sessionMins = Number(row.sessionMinutes);
		// if (isNaN(sessionMins) || sessionMins <= 0) return "Session Minutes must be > 0";

		const days = Number(row.noOfDaysInWeek);
		if (isNaN(days) || days < 1 || days > 7) return "Days in week must be between 1 and 7";

		// const bCap = Number(row.batchCapacity);
		// if (isNaN(bCap) || bCap < 1) return "Batch Capacity must be >= 1";

		// const pBatches = Number(row.totalParallelBatches);
		// if (isNaN(pBatches) || pBatches < 1) return "Parallel Batches must be >= 1";

		// const minA = Number(row.minAge);
		// if (isNaN(minA) || minA < 1) return "Min Age must be >= 1";

		// const maxA = Number(row.maxAge);
		// if (isNaN(maxA) || maxA < minA) return "Max Age cannot be less than Min Age";

		// const validGenders = ['Male', 'Female', 'Any'];
		// if (row.gender && !validGenders.includes(row.gender)) return "Gender must be 'Male', 'Female', or 'Any'";

		return null;
	}, []);

	const handleCreateCourse = useCallback(async (row: CourseImportRow) => {
		const parseBool = (val: any) => {
			if (typeof val === 'boolean') return val;
			const s = String(val).toLowerCase();
			return s === 'true' || s === '1' || s === 'yes';
		};

		const payload: Course = {
			courseName: row.courseName,
			courseType: row.courseType,
			classification: row.classification,

			introduceDate: row.introduceDate ? new Date(row.introduceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
			suspensionDate: row.suspensionDate ? new Date(row.suspensionDate).toISOString().split('T')[0] : null,

			chargingPattern: row.chargingPattern,
			avbFrom: row.avbFrom || null,
			avbTo: row.avbTo || null,

			sessionMinutes: Math.floor(Number(row.sessionMinutes)),
			noOfDaysInWeek: Math.floor(Number(row.noOfDaysInWeek)),
			daysPattern: row.daysPattern,
			unitsMultipleOf: row.unitsMultipleOf ? Number(row.unitsMultipleOf) : 1,

			batchCapacity: Number(row.batchCapacity || 1),
			totalParallelBatches: Number(row.totalParallelBatches || 1),
			maxPerson: row.maxPerson ? Number(row.maxPerson) : null,

			minAge: Number(row.minAge || 1),
			maxAge: Number(row.maxAge || 150),
			gender: row.gender || 'O',
			balanceUsable: row.balanceUsable || null,

			entityId: Number(row.entityId),
			activityId: Number(row.activityId),

			enrApprovalRequired: parseBool(row.enrApprovalRequired),
			cgstRate: row.cgstRate ? Number(row.cgstRate) : 0,
			sgstRate: row.sgstRate ? Number(row.sgstRate) : 0,

			status: row.status || 'active',
			createdBy: row.createdBy ? Number(row.createdBy) : null
		};

		await createCourse(payload);
	}, []);

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog">
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
									Bulk Import Courses
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Sync your course catalog with the database schema.
								</p>
							</div>
							<button onClick={onClose} className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="flex-1 overflow-hidden p-6 bg-gray-50 dark:bg-slate-900/50">
							<ExcelUpload<CourseImportRow>
								title="Course Curriculum Sheet"
								expectedColumns={expectedColumns}
								createFunction={handleCreateCourse}
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