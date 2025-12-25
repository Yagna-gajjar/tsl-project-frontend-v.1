import { useCallback, useEffect, useState } from "react";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import { createTransaction, updateTransaction } from "@/api/transaction.api";
import type { Transaction } from "@/types/transaction";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getEntities } from "@/api/entity.api";
import { getAccounts } from "@/api/account.api";
import { getMembers } from "@/api/member.api";

import type { Response } from "@/types/response";
import { toast } from "@/hooks/use-toast";
import type { FormFieldConfig } from "@/components/form-modal/types";
import type { Entity } from "@/types/entity";
import type { Account } from "@/types/account";
import type { Member } from "@/types/member";
import { getEnumsByCategory } from "@/api/enums.api";
import type { Enums } from "@/types/enums";

type Props = {
	isOpen: boolean;
	initialData?: Transaction;
	onClose: () => void;
	onSave: () => void;
};

const empty: Transaction = {
	transactionType: "receipt", // Default Choice
	typeSerialNo: "0",
	crEntityId: null,
	crAccountId: null,
	crMemberId: null,
	crMsNo: null,
	drEntityId: null,
	drAccountId: null,
	drMemberId: null,
	drMsNo: null,
	transactionDetails: "",
	entrySource: "web-ui",
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
	{ label: "ENR-2025-001 (Cricket Academy)", value: 101 },
	{ label: "ENR-2025-002 (Football Club)", value: 102 },
	{ label: "ENR-2025-003 (Tennis Pro)", value: 103 },
	{ label: "ENR-2025-004 (Swimming Basic)", value: 104 },
	{ label: "ENR-2025-005 (Badminton Elite)", value: 105 },
];

export default function TransactionFormModal({
	isOpen,
	initialData,
	onClose,
	onSave,
}: Props) {
	const [values, setValues] = useState<Transaction>(empty);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [error, setError] = useState<string | null>(null);

	const [entities, setEntities] = useState<Entity[]>([]);
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [members, setMembers] = useState<Member[]>([]);
	const [entrySourceOptions, setEntrySourceOptions] = useState<Enums[]>([]);

	useEffect(() => {
		if (!isOpen) return;
		const fetchOptions = async () => {
			try {
				const [entRes, accRes, memRes, enumRes]: [
					Response<Entity[]>,
					Response<Account[]>,
					Response<Member[]>,
					Response<Enums[]>
				] = await Promise.all([
					getEntities({ limit: 1000 }),
					getAccounts({ limit: 1000 }),
					getMembers({ limit: 1000 }),
					getEnumsByCategory("ENTRY SOURCE")
				]);

				setEntities(entRes.data ?? []);
				setAccounts(accRes.data ?? []);
				setMembers(memRes.data ?? []);
				setEntrySourceOptions(enumRes?.data ?? []);
			} catch (err) {
				console.error("Failed to load form options", err);
			}
		};
		fetchOptions();
	}, [isOpen]);

	useEffect(() => {
		setValues({ ...empty, ...(initialData ?? {}) });
		setFieldErrors({});
		setError(null);
	}, [initialData, isOpen]);

	const onChange = (field: keyof Transaction, val: any) => {
		setValues((p) => ({ ...p, [field]: val }));
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
		const errs = validate();
		if (Object.keys(errs).length > 0) {
			setFieldErrors(errs);
			setIsSubmitting(false);
			return;
		}

		try {
			const payload = { ...values };
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

	// Logic for hiding/showing fields
	const isReceipt = values.transactionType === "receipt";
	const isPayment = values.transactionType === "payment";

	const fields: FormFieldConfig<Transaction>[] = [
		{
			name: "transactionType",
			label: "Transaction Type",
			type: "select",
			required: true,
			options: [
				{ label: "Receipt", value: "receipt" },
				{ label: "Payment", value: "payment" }
			]
		},
		{ name: "amount", label: "Amount", type: "number", required: true },
		{ name: "formReferenceNo", label: "Reference No", type: "text" },
		{
			name: "entrySource",
			label: "Entry Source",
			type: "select",
			options: entrySourceOptions.map((e) => ({ label: e.value, value: e.value }))
		},
		{
			name: "enrollmentId",
			label: "Enrollment",
			type: "select",
			options: FAKE_ENROLLMENTS
		},

		// --- Credit Side ---
		// Hide Entity and Member if it's a Payment
		...(!isPayment ? [
			{
				name: "crEntityId" as keyof Transaction,
				label: "Credit Entity",
				type: "select" as const,
				options: entities.map((e) => ({ label: e.entityName, value: e.entityId }))
			},
			{
				name: "crMemberId" as keyof Transaction,
				label: "Credit Member",
				type: "select" as const,
				options: members.map((m) => ({ label: `${m.memberFirstName} ${m.memberLastName}`, value: m.memberId }))
			}
		] : []),
		{
			name: "crAccountId",
			label: "Credit Account",
			type: "select",
			options: accounts.map((a) => ({ label: a.accountName, value: a.accountId })),
			required: true
		},
		{ name: "crMsNo", label: "Credit Membership No", type: "number" },

		// --- Debit Side ---
		// Hide Entity and Member if it's a Receipt
		...(!isReceipt ? [
			{
				name: "drEntityId" as keyof Transaction,
				label: "Debit Entity",
				type: "select" as const,
				options: entities.map((e) => ({ label: e.entityName, value: e.entityId }))
			},
			{
				name: "drMemberId" as keyof Transaction,
				label: "Debit Member",
				type: "select" as const,
				options: members.map((m) => ({ label: `${m.memberFirstName} ${m.memberLastName}`, value: m.memberId }))
			}
		] : []),
		{
			name: "drAccountId",
			label: "Debit Account",
			type: "select",
			options: accounts.map((a) => ({ label: a.accountName, value: a.accountId })),
			required: true
		},
		{ name: "drMsNo", label: "Debit Membership No", type: "number" },

		// Remarks & Details
		{ name: "transactionDetails", label: "Transaction Details", type: "textarea" },
		{ name: "auditRemarks", label: "Audit Remarks", type: "textarea" },
		{ name: "printRemarks", label: "Print Remarks", type: "textarea" },
		{ name: "adminRemarks", label: "Admin Remarks", type: "textarea" },
		// {
		// 	name: "status", label: "Status", type: "select", options: [
		// 		{ label: "Active", value: "active" },
		// 		{ label: "Inactive", value: "inactive" }
		// 	]
		// },
		{ name: "accApproval", label: "Accountant Approval", type: "checkbox" },
	];

	if (!isOpen) return null;

	return (
		<Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-4xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
				<div className="flex flex-col max-h-[95vh]">
					<FormHeader
						title={initialData?.transactionId ? "Edit Transaction" : "New Transaction"}
						onClose={onClose}
					/>
					<div className="flex-1 overflow-y-auto p-1">
						<FormContent
							fields={fields}
							values={values}
							errors={fieldErrors}
							isSubmitting={isSubmitting}
							onChange={onChange}
							layout="grid"
							loading={false}
							error={error}
						/>
					</div>
					<FormFooter
						onClose={onClose}
						onSubmit={handleSubmit}
						submitLabel={initialData?.transactionId ? "Update Transaction" : "Create Transaction"}
						isSubmitting={isSubmitting}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}