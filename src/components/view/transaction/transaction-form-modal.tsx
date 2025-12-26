import { useCallback, useEffect, useState } from "react";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import { createTransaction, updateTransaction } from "@/api/transaction.api";
import type { Transaction } from "@/types/transaction";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getEntities } from "@/api/entity.api";
import { getAccounts } from "@/api/account.api";

import type { Response } from "@/types/response";
import { toast } from "@/hooks/use-toast";
import type { FormFieldConfig } from "@/components/form-modal/types";
import type { Entity } from "@/types/entity";
import type { Account } from "@/types/account";
import { getEnumsByCategory } from "@/api/enums.api";
import type { Enums } from "@/types/enums";
import { getAccountMembers } from "@/api/accountMember.api";
import type { AccountMember } from "@/types/accountMember";

type Props = {
	isOpen: boolean;
	initialData?: Transaction;
	onClose: () => void;
	onSave: () => void;
};

const empty: Transaction = {
	transactionType: "receipt",
	typeSerialNo: 0,
	crEntityId: null,
	crAccountId: null,
	crMemberId: null,
	crMsNo: null,
	drEntityId: 1,
	drAccountId: null,
	drMemberId: null,
	drMsNo: null,
	transactionDetails: "",
	entrySource: "Admin Office",
	enrollmentId: null,
	formReferenceNo: "",
	amount: 0,
	accApproval: false,
	auditRemarks: "",
	printRemarks: "",
	adminRemarks: "",
	status: "active",
	crEntityName: "",
	crAccountName: "",
	crMemberFirstName: "",
	crMemberLastName: "",
	drEntityName: "",
	drAccountName: "",
	drMemberFirstName: "",
	drMemberLastName: "",
};

const FAKE_ENROLLMENTS = [
	{ label: "ENR-2025-001 (Cricket Academy)", value: null },
	{ label: "ENR-2025-002 (Football Club)", value: null },
	{ label: "ENR-2025-003 (Tennis Pro)", value: null },
	{ label: "ENR-2025-004 (Swimming Basic)", value: null },
	{ label: "ENR-2025-005 (Badminton Elite)", value: null },
];

export default function TransactionFormModal({ isOpen, initialData, onClose, onSave }: Props) {
	const [values, setValues] = useState<Transaction>(empty);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [error, setError] = useState<string | null>(null);

	const [entities, setEntities] = useState<Entity[]>([]);
	const [crAccounts, setCrAccounts] = useState<Account[]>([]);
	const [drAccounts, setDrAccounts] = useState<Account[]>([]);
	const [crMembers, setCrMembers] = useState<AccountMember[]>([]);
	const [drMembers, setDrMembers] = useState<AccountMember[]>([]);
	const [entrySourceOptions, setEntrySourceOptions] = useState<Enums[]>([]);

	const filterPaymentModeAccounts = (accounts: Account[]) => {
		return accounts.filter(acc =>
			acc.accountName.toLowerCase().includes("cash") ||
			acc.accountName.toLowerCase().includes("transactions")
		);
	};

	useEffect(() => {
		if (!isOpen) return;
		const fetchBaseOptions = async () => {
			try {
				const [entRes, enumRes] = await Promise.all([
					getEntities({ limit: 1000 }),
					getEnumsByCategory("ENTRY SOURCE")
				]);
				setEntities(entRes.data ?? []);
				setEntrySourceOptions(enumRes?.data ?? []);
			} catch (err) {
				console.error("Failed to load options", err);
			}
		};
		fetchBaseOptions();
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		if (values.crEntityId) {
			getAccounts({ entityId: values.crEntityId, limit: 1000 }).then(res => {
				let data = res.data ?? [];
				if (values.crEntityId === 1) data = filterPaymentModeAccounts(data);
				setCrAccounts(data);
			});
		} else {
			setCrAccounts([]);
			setValues(v => ({ ...v, crAccountId: null }));
		}
	}, [values.crEntityId, isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		if (values.drEntityId) {
			getAccounts({ entityId: values.drEntityId, limit: 1000 }).then(res => {
				let data = res.data ?? [];
				if (values.drEntityId === 1) data = filterPaymentModeAccounts(data);
				setDrAccounts(data);
			});
		} else {
			setDrAccounts([]);
			setValues(v => ({ ...v, drAccountId: null }));
		}
	}, [values.drEntityId, isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		if (values.crAccountId) {
			getAccountMembers({ accountId: values.crAccountId, limit: 1000 }).then(res => setCrMembers(res.data ?? []));
		} else {
			setCrMembers([]);
			setValues(v => ({ ...v, crMemberId: null }));
		}
	}, [values.crAccountId, isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		if (values.drAccountId) {
			getAccountMembers({ accountId: values.drAccountId, limit: 1000 }).then(res => setDrMembers(res.data ?? []));
		} else {
			setDrMembers([]);
			setValues(v => ({ ...v, drMemberId: null }));
		}
	}, [values.drAccountId, isOpen]);

	useEffect(() => {
		setValues({ ...empty, ...(initialData ?? {}) });
		setFieldErrors({});
		setError(null);
	}, [initialData, isOpen]);

	const onChange = (field: keyof Transaction, val: any) => {
		let newValues = { ...values, [field]: val };

		if (field === "transactionType") {
			if (val === "receipt") {
				newValues.drEntityId = 1;
				newValues.drMemberId = null;
				newValues.crEntityId = null;
			} else if (val === "payment") {
				newValues.crEntityId = 1;
				newValues.crMemberId = null;
				newValues.drEntityId = null;
			}
		}

		setValues(newValues);
		setFieldErrors((prev) => {
			const copy = { ...prev };
			delete copy[field as string];
			return copy;
		});
	};

	const validate = useCallback(() => {
		const errs: Record<string, string> = {};
		if (!values.transactionType) errs.transactionType = "Type is required";
		if (!values.amount || Number(values.amount) <= 0) errs.amount = "Valid amount is required";
		if (!values.crAccountId) errs.crAccountId = "Credit Account is required";
		if (!values.drAccountId) errs.drAccountId = "Debit Account is required";
		return errs;
	}, [values]);

	const handleSubmit = useCallback(async () => {
		setIsSubmitting(true);
		setError(null);
		if (Object.keys(validate()).length > 0) {
			setFieldErrors(validate());
			setIsSubmitting(false);
			return;
		}

		try {
			const payload: Transaction = {
				...values,
				crMsNo: null,
				drMsNo: null,
				...(values.transactionType === "receipt" ? { drMemberId: null } : {}),
				...(values.transactionType === "payment" ? { crMemberId: null } : {}),
			};

			let res: Response;
			if (initialData?.transactionId) {
				res = await updateTransaction(initialData.transactionId, payload);
			} else {
				res = await createTransaction(payload);
			}

			if (!res.success) {
				setError(res.message || "Failed to save transaction");
				return;
			}

			toast({ title: "Success", description: "Transaction saved successfully" });
			onSave();
			onClose();
		} catch (err: any) {
			setError(err.message || "An error occurred");
		} finally {
			setIsSubmitting(false);
		}
	}, [validate, values, initialData, onSave, onClose]);

	const isReceipt = values.transactionType === "receipt";
	const isPayment = values.transactionType === "payment";

	// Logic to determine if the selected Payment Mode is a Cash account
	const selectedPaymentAccount = isReceipt
		? drAccounts.find(acc => acc.accountId === values.drAccountId)
		: crAccounts.find(acc => acc.accountId === values.crAccountId);

	const isCashPayment = selectedPaymentAccount?.accountName.toLowerCase().includes("cash");

	const fields: FormFieldConfig<Transaction>[] = [
		{
			name: "transactionType", label: "Transaction Type", type: "select", required: true,
			options: [{ label: "Receipt", value: "receipt" }, { label: "Payment", value: "payment" }]
		},
		{ name: "amount", label: "Amount", type: "number", required: true },
		{ name: "formReferenceNo", label: "Reference No", type: "text" },
		{
			name: "entrySource", label: "Entry Source", type: "select",
			options: entrySourceOptions.map((e) => ({ label: e.value, value: e.value })),
			disabled: true
		},
		{ name: "enrollmentId", label: "Enrollment", type: "select", options: FAKE_ENROLLMENTS },

		// --- Credit Side ---
		{
			name: "crEntityId",
			label: isReceipt ? "Select Client" : "Default Entity",
			type: "select",
			options: entities.map((e) => ({ label: e.entityName, value: e.entityId })),
			disabled: isPayment
		},
		{
			name: "crAccountId",
			label: isReceipt ? "Select Client Account" : "Payment Mode",
			type: "select",
			options: crAccounts.map((a) => ({ label: a.accountName, value: a.accountId })),
			required: true,
			disabled: !values.crEntityId
		},
		...(!isPayment ? [{
			name: "crMemberId" as keyof Transaction, label: "Client Member", type: "select" as const,
			options: crMembers.map((m) => ({ label: `${m.memberFirstName} ${m.memberLastName}`, value: m.memberId })),
			disabled: !values.crAccountId
		}] : []),

		// --- Debit Side ---
		{
			name: "drEntityId",
			label: isPayment ? "Select Client" : "Default Entity",
			type: "select",
			options: entities.map((e) => ({ label: e.entityName, value: e.entityId })),
			disabled: isReceipt
		},
		{
			name: "drAccountId",
			label: isPayment ? "Select Client Account" : "Payment Mode",
			type: "select",
			options: drAccounts.map((a) => ({ label: a.accountName, value: a.accountId })),
			required: true,
			disabled: !values.drEntityId
		},
		...(!isReceipt ? [{
			name: "drMemberId" as keyof Transaction, label: "Client Member", type: "select" as const,
			options: drMembers.map((m) => ({ label: `${m.memberFirstName} ${m.memberLastName}`, value: m.memberId })),
			disabled: !values.drAccountId
		}] : []),

		// Conditionally show Transaction Details if NOT a Cash Payment
		...(!isCashPayment ? [{ name: "transactionDetails" as keyof Transaction, label: "Transaction Details", type: "textarea" as const }] : []),

		{ name: "auditRemarks", label: "Audit Remarks", type: "textarea" },
		{ name: "printRemarks", label: "Print Remarks", type: "textarea" },
		{ name: "adminRemarks", label: "Admin Remarks", type: "textarea" },
		{
			name: "status", label: "Status", type: "select", options: [
				{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }
			]
		},
		{ name: "accApproval", label: "Accountant Approval", type: "checkbox" },
	];

	return (
		<Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-4xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
				<div className="flex flex-col max-h-[95vh]">
					<FormHeader title={initialData?.transactionId ? "Edit Transaction" : "New Transaction"} onClose={onClose} />
					<div className="flex-1 overflow-y-auto p-1">
						<FormContent fields={fields} values={values} errors={fieldErrors} isSubmitting={isSubmitting} onChange={onChange} layout="grid" loading={false} error={error} />
					</div>
					<FormFooter onClose={onClose} onSubmit={handleSubmit} submitLabel={initialData?.transactionId ? "Update Transaction" : "Create Transaction"} isSubmitting={isSubmitting} />
				</div>
			</DialogContent>
		</Dialog>
	);
}