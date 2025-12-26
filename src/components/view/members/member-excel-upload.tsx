import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExcelUpload from '@/components/ExcelUploader';
import { createMember } from '@/api/member.api';
import type { Member } from '@/types/member';

interface MemberExcelUploadProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

interface MemberImportRow {
	memberFirstName: string;
	memberMiddleName?: string;
	memberLastName: string;
	regDate?: string | number;
	suspensionDate?: string | number;
	dob?: string | undefined;
	email?: string;
	gender: string;
	personalStatusOrganization?: string;
	qualification?: string;
	motherTounge?: string;
	bloodGroup?: string;
	maritialStatus?: string;
	idProofType?: string;
	idProofNumber?: string;
	contactNumber?: string | number;
	transportMode?: string | undefined;
	personalStatus?: string;
	adminInstruction?: string;
	status?: string;
	remarks?: string;
	addressId: number | null;
}

export default function MemberExcelUpload({ isOpen, onClose, onSuccess }: MemberExcelUploadProps) {

	const expectedColumns = useMemo(() => [
		'memberFirstName',
		'memberMiddleName',
		'memberLastName',
		'gender',
		'dob',
		'email',
		'contactNumber',
		'regDate',
		'motherTounge',
		'bloodGroup',
		'maritialStatus',
		'idProofType',
		'idProofNumber',
		'qualification',
		'personalStatusOrganization',
		'personalStatus',
		'transportMode',
		'addressId',
		'status',
		'remarks',
		'adminInstruction'
	], []);

	const handleValidateRow = useCallback((row: MemberImportRow) => {
		if (!row.memberFirstName) return "First Name is required";
		// if (!row.memberLastName) return "Last Name is required";
		if (!row.gender) return "Gender is required";

		if (row.contactNumber && String(row.contactNumber).length > 10) {
			return "Contact Number must not exceed 10 characters";
		}

		return null;
	}, []);

	const handleCreateMember = useCallback(async (row: MemberImportRow) => {
		const payload: Member = {
			memberFirstName: row.memberFirstName,
			memberMiddleName: row.memberMiddleName || "",
			memberLastName: row.memberLastName,

			regDate: row.regDate ? new Date(row.regDate).toISOString() : new Date().toISOString(),
			suspensionDate: row.suspensionDate ? new Date(row.suspensionDate).toISOString() : null,
			dob: row.dob ? new Date(row.dob).toISOString() : undefined,

			email: row.email || undefined,
			gender: row.gender.toLowerCase(),

			personalStatusOrganization: row.personalStatusOrganization || "",
			qualification: row.qualification || undefined,
			mothertongue: row.motherTounge || "",
			bloodGroup: row.bloodGroup as Member["bloodGroup"] || undefined,
			maritialStatus: row.maritialStatus || "",

			idProofType: row.idProofType || undefined,
			idProofNumber: row.idProofNumber || undefined,
			contactNumber: row.contactNumber ? String(row.contactNumber) : undefined,
			transportMode: row.transportMode || undefined,

			personalStatus: row.personalStatus || "",
			adminInstruction: row.adminInstruction || undefined,
			status: (row.status || "active") as Member["status"],
			remarks: row.remarks || undefined,

			addressId: Number(row.addressId) ? row.addressId : null,
		};

		await createMember(payload);
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
						{/* Header */}
						<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950">
							<div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
									Bulk Import Members
								</h2>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
									Import personal details, contact info, and system preferences.
								</p>
							</div>
							<button
								onClick={onClose}
								className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Excel Upload Area */}
						<div className="flex-1 overflow-hidden p-6 bg-gray-50 dark:bg-slate-900/50">
							<ExcelUpload<MemberImportRow>
								title="Member Master Sheet"
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