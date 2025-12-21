import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createMembership } from '@/api/membership.api';
import type { MembershipMaster } from '@/types/memberShipMaster';

interface MembershipExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

// Interface for raw Excel data (handles flexible types from spreadsheet)
interface MembershipImportRow {
	membershipType: string;
	identityTypeId?: string | number;
	introductionDate: string | number;
	suspensionDate: string | number;
	billingEntityOfFamily?: string;
	membershipDetails: string;
	durationDays: number | string;
	caDepositPR: number | string;
	minIssueCharge: number | string;
	perMemberRegCharge: number | string;
	commPerMonthPerMember?: number | string;
	memberLimit?: number | string;
	DisOnCaUptoMembers?: number | string;
	disOnCaPerMember?: number | string;
	fBalPrInCa?: number | string;
	cBalPrInCa: number | string;
	vBalPrInCa?: number | string;
	bookingDiscount: number | string;
	graceDays: number | string;
	guestAllowed: string | boolean;
	clubAccess: string | boolean;
	birthdayVenueUsage: number | string;
	anniversaryVenueUsage: number | string;
	cancelChargesPrOnCa: number | string;
}

export default function MembershipExcelUpload({ isOpen, onClose, onSuccess }: MembershipExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'membershipType',
		'identityTypeId',
		'introductionDate',
		'suspensionDate',
		'billingEntityOfFamily',
		'membershipDetails',
		'durationDays',
		'caDepositPR',
		'minIssueCharge',
		'perMemberRegCharge',
		'commPerMonthPerMember',
		'memberLimit',
		'DisOnCaUptoMembers',
		'disOnCaPerMember',
		'fBalPrInCa',
		'cBalPrInCa',
		'vBalPrInCa',
		'bookingDiscount',
		'graceDays',
		'guestAllowed',
		'clubAccess',
		'birthdayVenueUsage',
		'anniversaryVenueUsage',
		'cancelChargesPrOnCa'
	], []);

	const handleValidateRow = useCallback((row: MembershipImportRow) => {
		if (!row.membershipType) return "Membership Type is required";
		if (!row.introductionDate) return "Introduction Date is required";
		if (!row.durationDays || isNaN(Number(row.durationDays))) return "Valid Duration Days is required";

		// Example of financial validation
		if (isNaN(Number(row.caDepositPR))) return "CA Deposit must be a number";
		if (isNaN(Number(row.cBalPrInCa))) return "Current Balance PR must be a number";

		return null;
	}, []);

	const handleCreateMembership = useCallback(async (row: MembershipImportRow) => {
		// Helper to handle boolean strings from Excel (e.g., "TRUE", "Yes", 1)
		const parseBool = (val: any) => {
			if (typeof val === 'boolean') return val;
			return String(val).toLowerCase() === 'true' || String(val) === '1' || String(val).toLowerCase() === 'yes';
		};

		const payload: MembershipMaster = {
			membershipType: row.membershipType,
			identityTypeId: row.identityTypeId ? Number(row.identityTypeId) : undefined,

			introductionDate: new Date(row.introductionDate).toISOString(),
			suspensionDate: new Date(row.suspensionDate).toISOString(),

			billingEntityOfFamily: row.billingEntityOfFamily,
			membershipDetails: row.membershipDetails,

			// Numeric Conversions
			durationDays: Number(row.durationDays),
			caDepositPR: Number(row.caDepositPR),
			minIssueCharge: Number(row.minIssueCharge),
			perMemberRegCharge: Number(row.perMemberRegCharge),
			commPerMonthPerMember: row.commPerMonthPerMember ? Number(row.commPerMonthPerMember) : 0,
			memberLimit: row.memberLimit ? Number(row.memberLimit) : undefined,
			DisOnCaUptoMembers: Number(row.DisOnCaUptoMembers || 0),
			disOnCaPerMember: Number(row.disOnCaPerMember || 0),
			fBalPrInCa: Number(row.fBalPrInCa || 0),
			cBalPrInCa: Number(row.cBalPrInCa),
			vBalPrInCa: Number(row.vBalPrInCa || 0),
			bookingDiscount: Number(row.bookingDiscount),
			graceDays: Number(row.graceDays),

			// Boolean Conversions
			guestAllowed: parseBool(row.guestAllowed),
			clubAccess: parseBool(row.clubAccess),

			birthdayVenueUsage: Number(row.birthdayVenueUsage),
			anniversaryVenueUsage: Number(row.anniversaryVenueUsage),
			cancelChargesPrOnCa: Number(row.cancelChargesPrOnCa),

			status: "active"
		};

		await createMembership(payload);
		console.log(`✅ Imported Membership: ${payload.membershipType}`);
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
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
							<div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
									Bulk Import Memberships
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Upload membership master configurations via Excel sheet.
								</p>
							</div>
							<button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="flex-1 overflow-hidden p-6 bg-gray-50 dark:bg-slate-900/50">
							<ExcelUpload<MembershipImportRow>
								title="Membership Master Sheet"
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