import { useEffect, useState } from "react";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import type { Transaction } from "@/types/transaction";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getAccounts } from "@/api/account.api";

import { toast } from "@/hooks/use-toast";
import type { FormFieldConfig } from "@/components/form-modal/types";
import type { Account } from "@/types/account";

type Props = {
	isOpen: boolean;
	initialData?: Partial<Transaction>; // Pre-filled CR details from Enrollment
	onClose: () => void;
	setTransactionData: (fn: (prev: any) => any) => void;
};

const DEFAULT_ORG_ENTITY = 1;

const emptyReceipt: Transaction = {
	transactionType: "receipt",
	enrollmentId: null,
	typeSerialNo: 0,
	crEntityId: null,
	crAccountId: null,
	crMemberId: null,
	crMsNo: null,
	drEntityId: DEFAULT_ORG_ENTITY,
	drAccountId: null,
	drMemberId: null,
	drMsNo: null,

	amount: 0,
	transactionDate: new Date(),
	transactionDetails: "",
	entrySource: "Admin Office",
	formReferenceNo: "",
	accApproval: false,
	auditRemarks: "",
	printRemarks: "",
	adminRemarks: "",
	status: "active",
};

export default function EnrollmentReceiptModal({
	isOpen,
	initialData,
	onClose,
	setTransactionData
}: Props) {
	const [values, setValues] = useState<Transaction>(emptyReceipt);
	const [drAccounts, setDrAccounts] = useState<Account[]>([]);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	// Filter for Payment Modes (Cash/Bank/Transactions)
	const filterPaymentModes = (accounts: Account[]) => {
		return accounts.filter(acc =>
			acc.accountName.toLowerCase().includes("cash") ||
			acc.accountName.toLowerCase().includes("bank") ||
			acc.accountName.toLowerCase().includes("transactions")
		);
	};

	// 1. Initialize logic
	useEffect(() => {
		if (isOpen) {
			setValues({
				...emptyReceipt,
				...initialData,
				transactionType: "receipt",
				drEntityId: DEFAULT_ORG_ENTITY,
				drMemberId: null,
				drMsNo: null,
			});
			setFieldErrors({});
		}
	}, [isOpen, initialData]);

	useEffect(() => {
		if (!isOpen) return;

		getAccounts({ entityId: DEFAULT_ORG_ENTITY, limit: 1000 }).then(res => {
			const data = res.data ?? [];
			setDrAccounts(filterPaymentModes(data));
		});
	}, [isOpen]);

	const onChange = (field: keyof Transaction, val: any) => {
		setValues((prev) => ({ ...prev, [field]: val }));
		if (fieldErrors[field as string]) {
			setFieldErrors((prev) => {
				const copy = { ...prev };
				delete copy[field as string];
				return copy;
			});
		}
	};

	const handleConfirm = () => {
		if (!values.drAccountId) {
			setFieldErrors({ drAccountId: "Please select a payment mode" });
			return;
		}

		setTransactionData((prev: any) => ({
			...prev,
			payment: { ...values }
		}));

		toast({ title: "Success", description: "Payment details linked to enrollment" });
		onClose();
	};

	const selectedAccount = drAccounts.find(a => a.accountId === values.drAccountId);
	const isCash = selectedAccount?.accountName.toLowerCase().includes("cash");

	const fields: FormFieldConfig<Transaction>[] = [
		{
			name: "amount",
			label: "Amount to Pay",
			type: "number",
			required: true,
			disabled: true
		},
		{
			name: "transactionDate",
			label: "Transaction Date",
			type: "Date",
			required: true,
		},
		{
			name: "drAccountId",
			label: "Select Payment Mode (Debit Account)",
			type: "select",
			required: true,
			options: drAccounts.map(a => ({ label: a.accountName, value: a.accountId })),
		},
		{ name: "formReferenceNo", label: "Reference / Chq / Ref No", type: "text" },
		...(!isCash ? [{
			name: "transactionDetails" as keyof Transaction,
			label: "Transaction Details",
			type: "textarea" as const
		}] : []),
		{ name: "printRemarks", label: "Remarks for Receipt Print", type: "textarea" },
	];

	return (
		<Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
				<div className="flex flex-col max-h-[85vh]">
					<FormHeader title="Enrollment Payment Details" onClose={onClose} />

					<div className="flex-1 overflow-y-auto">
						<FormContent
							fields={fields}
							values={values}
							errors={fieldErrors}
							onChange={onChange}
							layout="grid"
							error={""}
							isSubmitting={false}
							loading={false}
						/>
					</div>

					<FormFooter
						onClose={onClose}
						onSubmit={handleConfirm}
						submitLabel="Attach Payment"
						isSubmitting={false}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}