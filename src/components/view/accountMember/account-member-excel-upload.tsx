import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createAccountMember } from '@/api/accountMember.api';
import type { AccountMember } from '@/types/accountMember';

interface AccountMemberExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface AccountMemberImportRow {
	memberId: number | string;
	accountId: number | string;
	linkDate?: string | number;
	dlinkDate?: string | number;
	relationship: string;
	linkBilling?: string | boolean | number;
	authorityId?: number | string;
	ctcPerHr?: number | string;
	details?: string;
	status?: string;
}

export default function AccountMemberExcelUpload({ isOpen, onClose, onSuccess }: AccountMemberExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'memberId',
		'accountId',
		'relationship',
		'linkDate',
		'dlinkDate',
		'linkBilling',
		'authorityId',
		'ctcPerHr',
		'details',
		'status'
	], []);

	const handleValidateRow = useCallback((row: AccountMemberImportRow) => {
		if (!row.memberId || isNaN(Number(row.memberId))) return "Member ID is required";
		if (!row.accountId || isNaN(Number(row.accountId))) return "Account ID is required";
		if (!row.relationship) return "Relationship (e.g., 'Primary', 'Spouse') is required";

		return null;
	}, []);

	const handleCreateAccountMember = useCallback(async (row: AccountMemberImportRow) => {
		const parseBool = (val: any) => {
			if (typeof val === 'boolean') return val;
			const s = String(val).toLowerCase();
			return s === 'true' || s === '1' || s === 'yes';
		};

		const payload: AccountMember = {
			memberId: Number(row.memberId),
			accountId: Number(row.accountId),

			linkDate: row.linkDate ? new Date(row.linkDate).toISOString() : new Date().toISOString(),
			dlinkDate: row.dlinkDate ? new Date(row.dlinkDate).toISOString() : null,

			relationship: row.relationship,
			linkBilling: parseBool(row.linkBilling),

			authorityId: row.authorityId ? Number(row.authorityId) : undefined,
			ctcPerHr: row.ctcPerHr ? Math.round(Number(row.ctcPerHr)) : undefined,

			details: row.details || "",
			status: row.status || 'active'
		};

		await createAccountMember(payload);
		console.log(`✅ Linked Member ${payload.memberId} to Account ${payload.accountId} (${payload.relationship})`);
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
						{/* Header */}
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950">
							<div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
									Bulk Link Account Members
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Establish relationships and billing links between members and accounts.
								</p>
							</div>
							<button onClick={onClose} className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="flex-1 overflow-hidden p-6 bg-gray-50 dark:bg-slate-900/50">
							<ExcelUpload<AccountMemberImportRow>
								title="Account-Member Relationships"
								expectedColumns={expectedColumns}
								createFunction={handleCreateAccountMember}
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