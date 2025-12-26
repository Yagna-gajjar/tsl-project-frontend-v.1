import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createArea } from '@/api/area.api';
import type { Area } from '@/types/area';

interface AreaExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface AreaImportRow {
	facilityId: number | string;
	areaName: string;
	areaDimension?: string;
	areaSQFT?: number | string;
	level?: number;
	portion?: number | string;
	groundAreaPart?: string;
}

export default function AreaExcelUpload({ isOpen, onClose, onSuccess }: AreaExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'facilityId',
		'level',
		'areaName',
		'areaDimension',
		'areaSQFT',
		'portion',
		'groundAreaPart'
	], []);

	const handleValidateRow = useCallback((row: AreaImportRow) => {
		if (!row.facilityId || isNaN(Number(row.facilityId))) return "Valid Facility ID is required";
		if (!row.areaName) return "Area Name is required";

		if (row.areaSQFT && isNaN(Number(row.areaSQFT))) return "Area SQFT must be a number";
		if (row.portion && isNaN(Number(row.portion))) return "Portion must be a numeric value";

		return null;
	}, []);

	const handleCreateArea = useCallback(async (row: AreaImportRow) => {
		const payload: Area = {
			facilityId: Number(row.facilityId),
			level: Number(row.level),
			areaName: row.areaName,
			areaDimension: row.areaDimension || "",

			areaSQFT: row.areaSQFT ? Math.floor(Number(row.areaSQFT)) : undefined,
			portion: row.portion ? Math.floor(Number(row.portion)) : undefined,
			groundAreaPart: row.groundAreaPart || "",
		};

		await createArea(payload);
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
									Bulk Import Facility Areas
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Divide your facilities into specific zones, courts, or sectors.
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
							<ExcelUpload<AreaImportRow>
								title="Facility Sub-Area Master"
								expectedColumns={expectedColumns}
								createFunction={handleCreateArea}
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