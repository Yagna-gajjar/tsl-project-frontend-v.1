import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import type { membership } from '@/types/membership';
import { createMembership } from '@/api/membership.api';

interface MembershipExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

// Interface to map raw Excel strings/numbers to the typed membership object
interface MembershipImportRow {
	membershipMasterId: number | string;
	accountId?: number | string;
	startDate: string | number;
	endDate?: string | number;
	graceDate?: string | number;
	cancelationDate?: string | number;
	members: number | string;
	totalIssueCharges: number | string;
	appDiscount: number | string;
	totalFBalance: number | string;
	totalCBalance: number | string;
	totalSpentCa: number | string;
	minDepositeRequiredFBalance: number | string;
	minDepositeRequiredCBalance: number | string;
	depositeReq: number | string;
	vBalPrInCas: number | string;
	status: string;
	entityId?: number | string;
	QualifyingRecieptNo?: number | string;
}

export default function MembershipInstanceExcelUpload({ isOpen, onClose, onSuccess }: MembershipExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'membershipMasterId',
		'accountId',
		'startDate',
		'endDate',
		'graceDate',
		'members',
		'totalIssueCharges',
		'appDiscount',
		'totalFBalance',
		'totalCBalance',
		'totalSpentCa',
		'minDepositeRequiredFBalance',
		'minDepositeRequiredCBalance',
		'depositeReq',
		'vBalPrInCas',
		'status',
		'entityId'
	], []);

	const handleValidateRow = useCallback((row: MembershipImportRow) => {
		if (!row.membershipMasterId) return "Membership Master ID is required";
		if (!row.startDate) return "Start Date is required";
		if (isNaN(Number(row.members))) return "Number of members must be a valid number";

		// Ensure balances are numbers
		if (isNaN(Number(row.totalFBalance)) || isNaN(Number(row.totalCBalance))) {
			return "Financial balances must be numeric";
		}

		return null;
	}, []);

	const handleCreateRecord = useCallback(async (row: MembershipImportRow) => {
		const payload: Partial<membership> = {
			membershipMasterId: Number(row.membershipMasterId),
			accountId: row.accountId ? Number(row.accountId) : null,

			startDate: new Date(row.startDate).toISOString(),
			endDate: row.endDate ? new Date(row.endDate).toISOString() : undefined,
			graceDate: row.graceDate ? new Date(row.graceDate).toISOString() : undefined,
			cancelationDate: row.cancelationDate ? new Date(row.cancelationDate).toISOString() : null,

			members: Number(row.members),

			// Financials
			totalIssueCharges: Number(row.totalIssueCharges || 0),
			appDiscount: Number(row.appDiscount || 0),
			totalFBalance: Number(row.totalFBalance || 0),
			totalCBalance: Number(row.totalCBalance || 0),
			totalSpentCa: Number(row.totalSpentCa || 0),

			minDepositeRequiredFBalance: Number(row.minDepositeRequiredFBalance || 0),
			minDepositeRequiredCBalance: Number(row.minDepositeRequiredCBalance || 0),
			depositeReq: Number(row.depositeReq || 0),
			vBalPrInCas: Number(row.vBalPrInCas || 0),

			status: (row.status?.toLowerCase() as membership['status']) || "active",

			entityId: row.entityId ? Number(row.entityId) : undefined,
			QualifyingRecieptNo: row.QualifyingRecieptNo ? Number(row.QualifyingRecieptNo) : undefined,
		};

		await createMembership(payload as membership);
		console.log(`✅ Imported Membership Record for Master ID: ${payload.membershipMasterId}`);
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
									Import Membership Subscriptions
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Link members to membership master plans via Excel.
								</p>
							</div>
							<button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="flex-1 overflow-hidden p-6 bg-gray-50 dark:bg-slate-900/50">
							<ExcelUpload<MembershipImportRow>
								title="Subscription Sheet"
								expectedColumns={expectedColumns}
								createFunction={handleCreateRecord}
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