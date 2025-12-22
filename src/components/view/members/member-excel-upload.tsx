import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import type { Member } from '@/types/member';
import { createMember } from '@/api/member.api';

interface MemberExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface MemberImportRow {
	regDate: string | number;
	suspensionDate: string | number;
	memberFirstName: string;
	memberMiddleName?: string;
	memberLastName: string;
	dob?: string | number;
	email?: string;
	bloodGroup?: string;
	gender: string;
	personalStatus: string;
	personalStatusOrganization?: string;
	personalStatusSector: string;
	mothertongue: string;
	qualification?: string;
	idProofType?: string;
	idProofNumber?: string;
	contactNumber?: string | number;
	transportMode: string;
	addressId: number | string;
	remarks?: string;
	maratialStatus?: string;
	admitInstruction?: string;
	status: string;
	// Flattened address fields
	line1?: string;
	city?: string;
	state?: string;
	pinCode?: string | number;
}

export default function MemberExcelUpload({ isOpen, onClose, onSuccess }: MemberExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'memberFirstName', 'memberMiddleName', 'memberLastName',
		'regDate', 'dob', 'gender', 'email', 'contactNumber',
		'bloodGroup', 'mothertongue', 'personalStatus',
		'personalStatusSector', 'transportMode', 'addressId',
		'status', 'line1', 'city', 'state', 'pinCode'
	], []);

	const handleValidateRow = useCallback((row: MemberImportRow) => {
		if (!row.memberFirstName || !row.memberLastName) return "Full Name is required";
		if (!row.gender) return "Gender is required";
		if (!row.regDate) return "Registration Date is required";

		// Basic Email validation if provided
		if (row.email && !row.email.includes('@')) return "Invalid Email format";

		// Ensure addressId is numeric
		if (isNaN(Number(row.addressId))) return "Address ID must be a valid number";

		return null;
	}, []);

	const handleCreateMember = useCallback(async (row: MemberImportRow) => {
		const payload: Partial<Member> = {
			memberFirstName: row.memberFirstName,
			memberMiddleName: row.memberMiddleName,
			memberLastName: row.memberLastName,

			// Date formatting
			regDate: new Date(row.regDate).toISOString(),
			suspensionDate: row.suspensionDate ? new Date(row.suspensionDate).toISOString() : undefined,
			dob: row.dob ? new Date(row.dob) : undefined,

			email: row.email,
			gender: row.gender,
			contactNumber: row.contactNumber ? String(row.contactNumber) : undefined,
			bloodGroup: row.bloodGroup as Member['bloodGroup'],

			mothertongue: row.mothertongue || "English",
			personalStatus: row.personalStatus,
			personalStatusSector: row.personalStatusSector,
			transportMode: row.transportMode,

			// References and Status
			addressId: Number(row.addressId),
			status: (row.status?.toLowerCase() as Member['status']) || "active",

			// Optional/Remarks
			remarks: row.remarks,
			maratialStatus: row.maratialStatus,
			admitInstruction: row.admitInstruction,

			// Flattened address fields from Excel
			line1: row.line1,
			city: row.city,
			state: row.state,
			pinCode: row.pinCode ? String(row.pinCode) : undefined,
		};

		await createMember(payload as Member);
		console.log(`✅ Imported Member: ${payload.memberFirstName} ${payload.memberLastName}`);
	}, []);

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="absolute inset-0 bg-black/60 backdrop-blur-sm"
					/>

					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						className="relative w-full max-w-6xl h-[85vh] bg-white dark:bg-slate-950 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800"
					>
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
							<div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Bulk Import Members</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400">Import your member directory from a spreadsheet.</p>
							</div>
							<button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="flex-1 overflow-hidden p-6 bg-gray-50 dark:bg-slate-900/50">
							<ExcelUpload<MemberImportRow>
								title="Member Directory"
								expectedColumns={expectedColumns}
								createFunction={handleCreateMember}
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