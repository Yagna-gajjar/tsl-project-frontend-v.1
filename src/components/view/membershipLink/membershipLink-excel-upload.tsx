import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import type { MembershipLink } from '@/types/membershipLink';
import { createMembershipLink } from '@/api/membershipLink.api';

interface MembershipLinkExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface MembershipLinkImportRow {
	membershipMasterId: number | string;
	membershipId?: number | string;
	accountId: number | string;
	linkDate: string | number;
	dLinkDate: string | number;
}

export default function MembershipLinkExcelUpload({ isOpen, onClose, onSuccess }: MembershipLinkExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'membershipMasterId',
		'membershipId',
		'accountId',
		'linkDate',
		'dLinkDate'
	], []);

	const handleValidateRow = useCallback((row: MembershipLinkImportRow) => {
		if (!row.membershipMasterId) return "Membership Master ID is required";
		if (!row.accountId) return "Account ID is required";
		if (!row.linkDate) return "Link Date is required";

		if (isNaN(Number(row.membershipMasterId))) return "Master ID must be a number";
		if (isNaN(Number(row.accountId))) return "Account ID must be a number";

		return null;
	}, []);

	const handleCreateLink = useCallback(async (row: MembershipLinkImportRow) => {
		const payload: MembershipLink = {
			membershipMasterId: Number(row.membershipMasterId),
			membershipId: row.membershipId ? Number(row.membershipId) : undefined,
			accountId: Number(row.accountId),
		};

		await createMembershipLink(payload);
		console.log(`✅ Linked Account ${payload.accountId} to Master ${payload.membershipMasterId}`);
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
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950 z-10">
							<div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
									Bulk Link Memberships
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Map account IDs to membership masters via spreadsheet.
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
							<ExcelUpload<MembershipLinkImportRow>
								title="Membership Link Sheet"
								expectedColumns={expectedColumns}
								createFunction={handleCreateLink}
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