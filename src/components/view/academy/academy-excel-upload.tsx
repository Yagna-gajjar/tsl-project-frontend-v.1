import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import type { Academy } from '@/types/academy';
import { createAcademy } from '@/api/academy.api';

interface AcademyExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface AcademyImportRow {
	academyName: string;
	academyType: string;
	email: string;
	addressId?: string | number | null;
	registrationDate: string | number;
	contactNumber: string | number;
	instagram?: string;
	facebook?: string;
	youtube?: string;
	about?: string;
	share_main: number | string;
	share_tanna: number | string;
	share_tsl: number | string;
	share_expenses: number | string;
	panCard?: string;
	discountinuedDate?: string | null;
}

export default function AcademyExcelUpload({ isOpen, onClose, onSuccess }: AcademyExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'academyType',
		'registrationDate',
		'academyName',
		'addressId',
		'contactNumber',
		'email',
		'instagram',
		'facebook',
		'youtube',
		'about',
		'share_main',
		'share_tanna',
		'share_tsl',
		'share_expenses',
		'panCard',
		'discountinuedDate'
	], []);

	const handleValidateRow = useCallback((row: AcademyImportRow) => {
		if (!row.academyName) return "Academy Name is required";
		if (!row.academyType) return "Academy Type is required";
		if (!row.email) return "Email is required";

		if (isNaN(Number(row.share_main))) return "Share Main must be a number";
		if (isNaN(Number(row.share_tsl))) return "Share TSL must be a number";

		return null;
	}, []);

	const handleCreateAcademy = useCallback(async (row: AcademyImportRow) => {

		const cleanValue = (val: any) => (val === 'null' || val === '' ? null : val);

		const parseNum = (val: any) => {
			const num = Number(val);
			return isNaN(num) ? 0 : num;
		};

		const payload: Partial<Academy | any> = {
			academyName: row.academyName,
			academyType: row.academyType,
			email: row.email,
			addressId: cleanValue(row.addressId),
			registrationDate: row.registrationDate ? new Date(row.registrationDate).toISOString() : new Date().toISOString(),
			contactNumber: String(row.contactNumber),
			instagram: cleanValue(row.instagram),
			facebook: cleanValue(row.facebook),
			youtube: cleanValue(row.youtube),
			about: cleanValue(row.about),

			share_main: parseNum(row.share_main),
			share_tsl: parseNum(row.share_tsl),
			share_tanna: parseNum(row.share_tanna),
			share_expenses: parseNum(row.share_expenses),

			panCard: cleanValue(row.panCard),
			discountinuedDate: row.discountinuedDate ? new Date(row.discountinuedDate).toISOString() : undefined
		};

		await createAcademy(payload as any);

		console.log(`✅ Imported: ${payload.academyName}`);
	}, []);

	const handleUploadComplete = useCallback(() => {
		onSuccess();
	}, [onSuccess]);

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
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950 z-10">
							<div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
									Bulk Import Academies
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Review data before linking to database.
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
							<ExcelUpload<AcademyImportRow>
								title="Academy Sheet"
								expectedColumns={expectedColumns}
								createFunction={handleCreateAcademy}
								validateRow={handleValidateRow}
								onUploadComplete={handleUploadComplete}
							/>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
}