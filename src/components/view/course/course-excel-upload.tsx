import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createCourse } from '@/api/course.api';

interface CourseExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface CourseImportRow {
	courseName: string;
	courseType: string;
	classification: string;
	entityId: number | string;
	activityId: number | string;
	introduceDate?: string | number;
	suspensionDate?: string | number;
	chargingPattern: string;
	sessionMinutes: number | string;
	noOfDaysInWeek: number | string;
	daysPattern: string;
	unitsMultipleOf?: number | string;
	minEnrollmentUnits: number | string;
	batchCapacity: number | string;
	totalParallelBatches: number | string;
	minAge: number | string;
	maxAge: number | string;
	gender: 'Male' | 'Female' | 'Any';
	enrApprovalRequired?: string | boolean | number;
	cgstRate?: number | string;
	sgstRate?: number | string;
	status: string;
}

export default function CourseExcelUpload({ isOpen, onClose, onSuccess }: CourseExcelUploadProps) {

	// Columns based on SQL Table structure, focusing on mandatory and functional fields
	const expectedColumns = useMemo(() => [
		'courseName', 'courseType', 'classification', 'entityId', 'activityId',
		'chargingPattern', 'sessionMinutes', 'noOfDaysInWeek', 'daysPattern',
		'minEnrollmentUnits', 'batchCapacity', 'totalParallelBatches',
		'minAge', 'maxAge', 'gender', 'enrApprovalRequired', 'status'
	], []);

	const handleValidateRow = useCallback((row: CourseImportRow) => {
		if (!row.courseName) return "Course Name is required";
		if (!row.entityId || isNaN(Number(row.entityId))) return "Entity ID must be a number";
		if (!row.activityId || isNaN(Number(row.activityId))) return "Activity ID must be a number";

		if (Number(row.sessionMinutes) <= 0) return "Session Minutes must be greater than 0";

		const days = Number(row.noOfDaysInWeek);
		if (days < 1 || days > 7) return "Days in week must be between 1 and 7";

		const validGenders = ['Male', 'Female', 'Any'];
		if (!validGenders.includes(row.gender)) return "Gender must be 'Male', 'Female', or 'Any'";

		if (Number(row.maxAge) < Number(row.minAge)) return "Max Age cannot be less than Min Age";

		return null;
	}, []);

	const handleCreateCourse = useCallback(async (row: CourseImportRow) => {
		const parseBool = (val: any) => {
			if (typeof val === 'boolean') return val;
			const s = String(val).toLowerCase();
			return s === 'true' || s === '1' || s === 'yes';
		};

		const payload = {
			courseName: row.courseName,
			courseType: row.courseType,
			classification: row.classification,
			entityId: Number(row.entityId),
			activityId: Number(row.activityId),

			introduceDate: row.introduceDate ? new Date(row.introduceDate).toISOString() : new Date().toISOString(),
			suspensionDate: row.suspensionDate ? new Date(row.suspensionDate).toISOString() : null,

			chargingPattern: row.chargingPattern,
			sessionMinutes: Math.floor(Number(row.sessionMinutes)),
			noOfDaysInWeek: Math.floor(Number(row.noOfDaysInWeek)),
			daysPattern: row.daysPattern,

			unitsMultipleOf: row.unitsMultipleOf ? Number(row.unitsMultipleOf) : 1,
			minEnrollmentUnits: Number(row.minEnrollmentUnits || 1),
			batchCapacity: Number(row.batchCapacity || 1),
			totalParallelBatches: Number(row.totalParallelBatches || 1),

			minAge: Number(row.minAge || 1),
			maxAge: Number(row.maxAge || 150),
			gender: row.gender,

			enrApprovalRequired: parseBool(row.enrApprovalRequired),
			cgstRate: row.cgstRate ? Number(row.cgstRate) : 0,
			sgstRate: row.sgstRate ? Number(row.sgstRate) : 0,
			status: row.status || 'active'
		};

		await createCourse(payload);
		console.log(`✅ Imported Course: ${payload.courseName}`);
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
									Define new training programs, capacity limits, and age restrictions.
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