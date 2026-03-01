import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createAuthority } from '@/api/authority.api';

interface AuthorityExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface AuthorityImportRow {
	memberId: number | string;
	accountId: number | string;
	linkingDate?: string | number;
	dlinkDate?: string | number;
	level: number | string;
	status: string;
}

export default function AuthorityExcelUpload({ isOpen, onClose, onSuccess }: AuthorityExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'memberId',
		'accountId',
		'level',
		'status',
		'linkingDate',
		'dlinkDate'
	], []);

	const handleValidateRow = useCallback((row: AuthorityImportRow) => {
		if (!row.memberId || isNaN(Number(row.memberId))) return "Valid Member ID is required";
		if (!row.accountId || isNaN(Number(row.accountId))) return "Valid Account ID is required";
		if (row.level === undefined || isNaN(Number(row.level))) return "Level must be a valid number";

		return null;
	}, []);
	const handleCreateAuthority = useCallback(async (row: AuthorityImportRow) => {
		const payload = {
			memberId: Number(row.memberId),
			accountId: Number(row.accountId),

			linkingDate: row.linkingDate ? new Date(row.linkingDate).toISOString() : new Date().toISOString(),
			dlinkDate: row.dlinkDate ? new Date(row.dlinkDate).toISOString() : null,

			level: Math.floor(Number(row.level)),

			status: row.status || 'active',
		};

		await createAuthority(payload as any);
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
						className="relative w-full max-w-4xl h-[75vh] bg-white dark:bg-slate-950 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800"
					>
						{/* Header */}
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950">
							<div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
									Bulk Import Authorities
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Link members to accounts and define their access levels.
								</p>
							</div>
							<button
								onClick={onClose}
								className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Excel Upload Body */}
						<div className="flex-1 overflow-hidden p-6 bg-gray-50 dark:bg-slate-900/50">
							<ExcelUpload<AuthorityImportRow>
								title="Authority Mapping Sheet"
								expectedColumns={expectedColumns}
								createFunction={handleCreateAuthority}
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