import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createTransaction } from '@/api/transaction.api';
import type { Transaction } from '@/types/transaction';

interface TransactionExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface TransactionImportRow {
	transactionType: string;
	amount: string | number;
	crEntityId: string | number;
	crAccountId: string | number;
	drEntityId: string | number;
	drAccountId: string | number;
	transactionDetails?: string;
	formReferenceNo?: string;
}

export default function TransactionExcelUpload({ isOpen, onClose, onSuccess }: TransactionExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'transactionType',
		'amount',
		'crEntityId',
		'crAccountId',
		'drEntityId',
		'drAccountId',
		'transactionDetails',
		'formReferenceNo'
	], []);

	const handleValidateRow = useCallback((row: TransactionImportRow) => {
		if (!row.transactionType) return "Transaction Type is required";
		if (!row.amount || isNaN(Number(row.amount))) return "Valid Amount is required";

		if (!row.crEntityId || isNaN(Number(row.crEntityId))) return "Credit Entity ID is required";
		if (!row.crAccountId || isNaN(Number(row.crAccountId))) return "Credit Account ID is required";
		if (!row.drEntityId || isNaN(Number(row.drEntityId))) return "Debit Entity ID is required";
		if (!row.drAccountId || isNaN(Number(row.drAccountId))) return "Debit Account ID is required";

		return null;
	}, []);

	const handleCreateTransaction = useCallback(async (row: TransactionImportRow) => {
		const payload: Transaction | any = {
			transactionType: String(row.transactionType),
			typeSerialNo: 0,
			amount: Number(row.amount),

			crEntityId: Number(row.crEntityId),
			crAccountId: Number(row.crAccountId),
			crMemberId: null,
			crMsNo: null,
			crEntityName: "",
			crAccountName: "",
			crMemberFirstName: "",
			crMemberLastName: "",

			drEntityId: Number(row.drEntityId),
			drAccountId: Number(row.drAccountId),
			drMemberId: null,
			drMsNo: null,
			drEntityName: "",
			drAccountName: "",
			drMemberFirstName: "",
			drMemberLastName: "",

			transactionDetails: row.transactionDetails || "",
			entrySource: "Excel Import",
			enrollmentId: null,
			formReferenceNo: String(row.formReferenceNo || ""),
			accApproval: false,

			auditRemarks: "",
			printRemarks: "",
			adminRemarks: "",
			status: "active"
		};

		await createTransaction(payload);
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
						className="relative w-full max-w-5xl h-[75vh] bg-white dark:bg-slate-950 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800"
					>
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950">
							<div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
									Bulk Import Transactions
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Upload financial records using a standardized CSV/Excel template.
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
							<ExcelUpload<TransactionImportRow>
								title="Transaction Master Upload"
								expectedColumns={expectedColumns}
								createFunction={handleCreateTransaction}
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