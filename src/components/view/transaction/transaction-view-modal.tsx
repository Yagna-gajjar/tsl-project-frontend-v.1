import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { Transaction } from "@/types/transaction";
import { getTransactionById } from "@/api/transaction.api";
import {
	Tag,
	Hash,
	User,
	Wallet,
	Calendar,
	DollarSign,
	ClipboardList,
	Info,
	CheckCircle2,
} from "lucide-react";
import type { FieldConfig } from "@/components/view-modal/types";
import type { Response } from "@/types/response";

type Props = {
	isOpen: boolean;
	transactionId?: number;
	onClose: () => void;
};

const fields: FieldConfig<Transaction>[] = [
	{ key: "transactionId", label: "Tx ID", icon: Hash },
	{ key: "transactionType", label: "Type", icon: Tag },
	{ key: "transactionDate", label: "Date", icon: Calendar, render: (v) => (v ? new Date(v as string).toLocaleDateString() : "-") },
	{ key: "status", label: "Status", icon: Info },
	{ key: "amount", label: "Amount", icon: DollarSign, render: (v) => `₹${Number(v).toLocaleString('en-IN')}` },

	{ key: "crEntityName", label: "Credit Entity", icon: Wallet },
	{ key: "crAccountName", label: "Credit Account", icon: Wallet },
	{ key: "crMemberFirstName", label: "Credit Member", icon: User, render: (v, row) => `${v} ${row.crMemberLastName || ""}` },

	{ key: "drEntityName", label: "Debit Entity", icon: Wallet },
	{ key: "drAccountName", label: "Debit Account", icon: Wallet },
	{ key: "drMemberFirstName", label: "Debit Member", icon: User, render: (v, row) => `${v} ${row.drMemberLastName || ""}` },

	{ key: "transactionDetails", label: "Details", icon: ClipboardList },
	{ key: "accApproval", label: "Acc Approval", icon: CheckCircle2, render: (v) => (v ? "Approved" : "Pending") },
	{ key: "formReferenceNo", label: "Ref No", icon: Hash },
	{ key: "entrySource", label: "Source", icon: Info },

	{ key: "auditRemarks", label: "Audit Remarks", icon: ClipboardList },
	{ key: "adminRemarks", label: "Admin Remarks", icon: ClipboardList },

	{
		key: "createdAt",
		label: "Created At",
		icon: Calendar,
		render: (v) => (v ? new Date(v as string).toLocaleString() : "-"),
	},
];

export default function TransactionViewModal({ isOpen, transactionId, onClose }: Props) {
	const fetchFn = useCallback(
		async (id?: number | string) => {
			const useId = id ?? transactionId;
			if (!useId) throw new Error("Transaction ID missing");

			const res: Response<Transaction> = await getTransactionById(Number(useId));
			return res?.data;
		},
		[transactionId]
	);

	return (
		<ViewModal<Transaction>
			isOpen={isOpen}
			onClose={onClose}
			itemId={Number(transactionId)}
			fetchFn={fetchFn as (id?: string | number) => Promise<Transaction>}
			fields={fields}
			title="Transaction Details"
			layout="grid"
		/>
	);
}