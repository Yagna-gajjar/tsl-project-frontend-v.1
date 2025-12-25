import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createFacility } from '@/api/facility.api';

interface FacilityExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface FacilityImportRow {
	facilityName: string;
	facilityType: string;
	facilityDimension?: string;
	areaSQFT?: number | string;
	description?: string;
	academicCapacity?: number | string;
	recreationCapacity?: number | string;
	eventCapacity?: number | string;
	level?: number;
}

export default function FacilityExcelUpload({ isOpen, onClose, onSuccess }: FacilityExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'facilityName',
		'facilityType',
		'facilityDimension',
		'areaSQFT',
		'description',
		'academicCapacity',
		'recreationCapacity',
		'eventCapacity',
		'level'
	], []);

	const handleValidateRow = useCallback((row: FacilityImportRow) => {
		if (!row.facilityName) return "Facility Name is required";
		if (!row.facilityType) return "Facility Type (e.g., 'Indoor', 'Outdoor') is required";

		if (row.areaSQFT && isNaN(Number(row.areaSQFT))) return "Area SQFT must be a number";
		if (row.academicCapacity && isNaN(Number(row.academicCapacity))) return "Academic Capacity must be a number";
		if (row.recreationCapacity && isNaN(Number(row.recreationCapacity))) return "Recreation Capacity must be a number";
		if (row.eventCapacity && isNaN(Number(row.eventCapacity))) return "Event Capacity must be a number";

		return null;
	}, []);

	const handleCreateFacility = useCallback(async (row: FacilityImportRow) => {
		const payload = {
			facilityName: row.facilityName,
			facilityType: row.facilityType,
			facilityDimension: row.facilityDimension || "",

			areaSQFT: row.areaSQFT ? Math.floor(Number(row.areaSQFT)) : null,
			description: row.description || "",

			academicCapacity: row.academicCapacity ? Math.floor(Number(row.academicCapacity)) : null,
			recreationCapacity: row.recreationCapacity ? Math.floor(Number(row.recreationCapacity)) : null,
			eventCapacity: row.eventCapacity ? Math.floor(Number(row.eventCapacity)) : null,
			level: row.level ? Math.floor(Number(row.level)) : 1,
		};

		await createFacility(payload);
		console.log(`✅ Imported Facility: ${payload.facilityName}`);
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
									Bulk Import Facilities
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Register infrastructure, dimensions, and capacity limits.
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
							<ExcelUpload<FacilityImportRow>
								title="Infrastructure Master Sheet"
								expectedColumns={expectedColumns}
								createFunction={handleCreateFacility}
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