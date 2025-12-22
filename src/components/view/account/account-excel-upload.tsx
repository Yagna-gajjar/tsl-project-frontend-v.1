import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createAccount } from '@/api/account.api';

interface AccountExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface AccountImportRow {
	regDate: string | number;
	suspensionDate?: string | number;
	entityId?: number | string;
	entityType?: string;
	accountType: string;
	accountName: string;
	addressId?: number | string;
	contact: string | number;
	proffesionalSector?: string;
	adminInstruction?: string;
	status: string;
}

export default function AccountExcelUpload({ isOpen, onClose, onSuccess }: AccountExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'accountName',
		'accountType',
		'regDate',
		'suspensionDate',
		'entityId',
		'entityType',
		'addressId',
		'contact',
		'proffesionalSector',
		'adminInstruction',
		'status'
	], []);

	const handleValidateRow = useCallback((row: AccountImportRow) => {
		if (!row.accountName) return "Account Name is required";
		if (!row.accountType) return "Account Type is required";

		if (row.entityId && isNaN(Number(row.entityId))) {
			return "Entity ID must be a valid number";
		}

		if (row.addressId && isNaN(Number(row.addressId))) {
			return "Address ID must be a valid number";
		}

		if (row.contact && String(row.contact).length > 20) {
			return "Contact must be maximum 20 characters";
		}

		return null;
	}, []);

	const handleCreateAccount = useCallback(async (row: AccountImportRow) => {
		const payload = {
			accountName: row.accountName,
			accountType: row.accountType,

			regDate: row.regDate ? new Date(row.regDate).toISOString() : new Date().toISOString(),
			suspensionDate: row.suspensionDate ? new Date(row.suspensionDate).toISOString() : undefined,

			entityId: row.entityId ? Number(row.entityId) : null,
			addressId: row.addressId ? Number(row.addressId) : null,

			entityType: row.entityType,
			contact: String(row.contact),
			proffesionalSector: row.proffesionalSector,
			adminInstruction: row.adminInstruction,
			status: row.status || 'active'
		};

		await createAccount(payload);
		console.log(`✅ Imported Account: ${payload.accountName}`);
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
						className="relative w-full max-w-6xl h-[85vh] bg-white dark:bg-slate-950 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800"
					>
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950">
							<div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
									Bulk Import Accounts
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Import master accounts and link them to entities or addresses.
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
							<ExcelUpload<AccountImportRow>
								title="Account Registry Sheet"
								expectedColumns={expectedColumns}
								createFunction={handleCreateAccount}
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