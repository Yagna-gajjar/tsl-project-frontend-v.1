import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import type { Enums } from '@/types/enums';
import { createEnum } from '@/api/enums.api';

interface EnumExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface EnumImportRow {
	category: string;
	value: string;
	status: string | boolean | number;
	description?: string;
	enumCase: number | string;
}

export default function EnumExcelUpload({ isOpen, onClose, onSuccess }: EnumExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'category',
		'value',
		'status',
		'description',
		'enumCase'
	], []);

	const handleValidateRow = useCallback((row: EnumImportRow) => {
		if (!row.category) return "Category is required (e.g., 'GENDER')";
		if (!row.value) return "Value is required (e.g., 'Male')";
		if (row.enumCase === undefined || isNaN(Number(row.enumCase))) {
			return "Enum Case must be a number";
		}
		return null;
	}, []);

	const handleCreateEnum = useCallback(async (row: EnumImportRow) => {
		const parseBoolean = (val: any) => {
			if (typeof val === 'boolean') return val;
			const str = String(val).toLowerCase();
			return str === 'true' || str === '1' || str === 'active' || str === 'yes';
		};

		const payload: Partial<Enums> = {
			category: row.category.toUpperCase().trim(),
			value: row.value.trim(),
			status: parseBoolean(row.status),
			description: row.description || null,
			enumCase: Number(row.enumCase),
		};

		await createEnum(payload as Enums);
	}, []);

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
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
						className="relative w-full max-w-4xl h-[80vh] bg-white dark:bg-slate-950 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800"
					>
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
							<div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
									Bulk Import System Enums
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Manage categories, status labels, and system constants.
								</p>
							</div>
							<button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="flex-1 overflow-hidden p-6 bg-gray-50 dark:bg-slate-900/50">
							<ExcelUpload<EnumImportRow>
								title="Enums Sheet"
								expectedColumns={expectedColumns}
								createFunction={handleCreateEnum}
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