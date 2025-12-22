import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createMembership } from '@/api/membership.api';

interface MembershipExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

// Interface for raw Excel row data mapping to the SQL "Membership" table
interface MembershipImportRow {
	membershipMasterId: number | string;
	accountId: number | string;
	entityId?: number | string;
	startDate: string | number;
	endDate?: string | number;
	graceDate?: string | number;
	members: number | string;
	totalIssueCharges: number | string;
	appDiscount: number | string;
	totalFBalance: number | string;
	totalCBalance: number | string;
	totalSpentCa: number | string;
	caDepositPRRequiredFBalance: number | string;
	caDepositPRRequiredCBalance: number | string;
	depositeReq: number | string;
	vBalPrInCa: number | string;
	status: string;
	cancelationDate?: string | number;
	actualFBalance?: number | string;
	actualCBalance?: number | string;
	refundedAmount?: number | string;
	qualifyingRecieptNo?: number | string;
}

export default function MembershipExcelUpload({ isOpen, onClose, onSuccess }: MembershipExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'membershipMasterId',
		'entityId',
		'startDate',
		'endDate',
		'graceDate',
		'members',
		'totalIssueCharges',
		'appDiscount',
		'totalFBalance',
		'totalCBalance',
		'totalSpentCa',
		'caDepositPRRequiredFBalance',
		'caDepositPRRequiredCBalance',
		'depositeReq',
		'vBalPrInCa',
		'status'
	], []);

	const handleValidateRow = useCallback((row: MembershipImportRow) => {
		if (!row.membershipMasterId) return "Membership Master ID is required";
		if (!row.startDate) return "Start Date is required";

		// Check for numeric validity on mandatory IDs
		if (isNaN(Number(row.membershipMasterId))) return "Master ID must be a valid number";
		if (isNaN(Number(row.accountId))) return "Account ID must be a valid number";

		return null;
	}, []);

	const handleCreateMembership = useCallback(async (row: MembershipImportRow) => {
		// Construct the payload to match SQL constraints (Handling DEFAULT values and Types)
		const payload = {
			membershipMasterId: Number(row.membershipMasterId),
			accountId: Number(row.accountId),
			entityId: row.entityId ? Number(row.entityId) : null,

			// Date formatting (using NOW() equivalent if missing)
			startDate: row.startDate ? new Date(row.startDate).toISOString() : new Date().toISOString(),
			endDate: row.endDate ? new Date(row.endDate).toISOString() : new Date().toISOString(),
			graceDate: row.graceDate ? new Date(row.graceDate).toISOString() : new Date().toISOString(),
			cancelationDate: row.cancelationDate ? new Date(row.cancelationDate).toISOString() : null,

			members: Number(row.members || 1),

			// Numeric and Financial fields (INTEGER and NUMERIC)
			totalIssueCharges: Number(row.totalIssueCharges || 0),
			appDiscount: Number(row.appDiscount || 0),
			totalFBalance: Number(row.totalFBalance || 0),
			totalCBalance: Number(row.totalCBalance || 0),
			totalSpentCa: Number(row.totalSpentCa || 0),

			caDepositPRRequiredFBalance: Number(row.caDepositPRRequiredFBalance || 0),
			caDepositPRRequiredCBalance: Number(row.caDepositPRRequiredCBalance || 0),
			depositeReq: Number(row.depositeReq || 0),
			vBalPrInCa: Number(row.vBalPrInCa || 0),

			status: row.status || 'active',

			actualFBalance: row.actualFBalance ? Number(row.actualFBalance) : null,
			actualCBalance: row.actualCBalance ? Number(row.actualCBalance) : null,
			refundedAmount: row.refundedAmount ? Number(row.refundedAmount) : null,
			qualifyingRecieptNo: row.qualifyingRecieptNo ? Number(row.qualifyingRecieptNo) : null,
		};

		await createMembership(payload);
		console.log(`✅ Imported Membership for Account ID: ${payload.accountId}`);
	}, []);

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
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
									Bulk Import Subscriptions
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Link active accounts to membership plans and financial balances.
								</p>
							</div>
							<button onClick={onClose} className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="flex-1 overflow-hidden p-6 bg-gray-50 dark:bg-slate-900/50">
							<ExcelUpload<MembershipImportRow>
								title="Membership Data Sheet"
								expectedColumns={expectedColumns}
								createFunction={handleCreateMembership}
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