import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createEntity } from '@/api/entity.api';

interface EntityExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface EntityImportRow {
	entityName: string;
	regDate: string | number;
	suspensionDate?: string | number;
	entityType: string;
	legalStatus: string;
	legalName: string;
	financialDetails?: string;
	gstRegNo?: string | number;
	otherFinancialDetails?: string;
	email: string;
	officeContact: string | number;
	addressId: number | string;
	sector: string;
	entityNature: string;
	entityRole: string;
	status: string;
}

export default function EntityExcelUpload({ isOpen, onClose, onSuccess }: EntityExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'entityName',
		'regDate',
		'suspensionDate',
		'entityType',
		'legalStatus',
		'legalName',
		'financialDetails',
		'gstRegNo',
		'otherFinancialDetails',
		'email',
		'officeContact',
		'addressId',
		'sector',
		'entityNature',
		'entityRole',
		'status'
	], []);

	const handleValidateRow = useCallback((row: EntityImportRow) => {
		if (!row.entityName) return "Entity Name is required";
		if (!row.entityType) return "Entity Type is required";

		if (row.officeContact && String(row.officeContact).length > 10) {
			return "Office Contact must be maximum 10 digits";
		}

		if (isNaN(Number(row.addressId))) return "Address ID must be a valid number";

		return null;
	}, []);

	const handleCreateEntity = useCallback(async (row: EntityImportRow) => {
		const payload = {
			entityName: row.entityName,
			regDate: row.regDate ? new Date(row.regDate).toISOString() : new Date().toISOString(),
			suspensionDate: row.suspensionDate ? new Date(row.suspensionDate).toISOString() : undefined,
			entityType: row.entityType,
			legalStatus: row.legalStatus,
			legalName: row.legalName,
			financialDetails: row.financialDetails,

			gstRegNo: row.gstRegNo ? Number(row.gstRegNo) : undefined,
			otherFinancialDetails: row.otherFinancialDetails,
			email: row.email,
			officeContact: String(row.officeContact),

			addressId: Number(row.addressId),
			sector: row.sector,
			entityNature: row.entityNature,
			entityRole: row.entityRole,
			status: row.status || 'active'
		};

		await createEntity(payload);
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
									Bulk Import Entities
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Import companies and organizations into the system.
								</p>
							</div>
							<button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Excel Upload Area */}
						<div className="flex-1 overflow-hidden p-6 bg-gray-50 dark:bg-slate-900/50">
							<ExcelUpload<EntityImportRow>
								title="Entity Master Sheet"
								expectedColumns={expectedColumns}
								createFunction={handleCreateEntity}
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