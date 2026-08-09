import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getEnrollmentById, getEnrollments } from "@/api/enrollment.api";
import type { Enrollment } from "@/types/enrollment";
import { format } from "date-fns";

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
	transactionDate: new Date(),
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

const ENROLLMENT_PAGE_SIZE = 20;

/**
 * "Member No 3(3)  Football  31 Jul 2026  #137"
 *  name(memberId)  course     enrollment date  enrollment id
 *
 * The trailing enrollment id keeps rows distinguishable when the same member
 * has more than one enrollment on the same course and date.
 */
function enrollmentLabel(e: Enrollment): string {
	const name =
		[e.memberFirstName, e.memberLastName]
			.filter(Boolean)
			.join(" ")
			.trim() ||
		e.walkingName ||
		"Unknown member";

	const who = e.memberId ? `${name}(${e.memberId})` : name;
	const course = e.courseName || e.activityName || "No course";

	let date = "";
	if (e.enrollmentDate) {
		const d = new Date(e.enrollmentDate);
		if (!isNaN(d.getTime())) date = format(d, "dd MMM yyyy");
	}

	return [who, course, date, `#${e.enrollmentId}`]
		.filter(Boolean)
		.join("  ");
}

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

	const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
	const [enrollmentsPage, setEnrollmentsPage] = useState(1);
	const [hasMoreEnrollments, setHasMoreEnrollments] = useState(true);
	const [loadingEnrollments, setLoadingEnrollments] = useState(false);
	const [enrollmentSearch, setEnrollmentSearch] = useState("");
	const enrollmentSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Guards against a slow page-1 response overwriting a newer search's results.
	const enrollmentRequestId = useRef(0);

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

	const fetchEnrollments = useCallback(
		async (isInitial = false, searchStr = enrollmentSearch) => {
			// An initial/search fetch always wins: it supersedes anything in
			// flight (the request id below discards the stale response), so it
			// must not be dropped just because a page load is still running.
			if (!isInitial && (loadingEnrollments || !hasMoreEnrollments)) return;

			const requestId = isInitial
				? ++enrollmentRequestId.current
				: enrollmentRequestId.current;

			setLoadingEnrollments(true);
			try {
				const page = isInitial ? 1 : enrollmentsPage;
				const res: Response<Enrollment[]> = await getEnrollments({
					page,
					limit: ENROLLMENT_PAGE_SIZE,
					sortBy: "enrollmentDate",
					sortOrder: "DESC",
					search: searchStr || undefined,
				});

				// A newer search superseded this response.
				if (requestId !== enrollmentRequestId.current) return;

				const data = res?.data ?? [];
				setEnrollments((prev) => {
					if (isInitial) return data;
					const seen = new Set(prev.map((e) => e.enrollmentId));
					return [...prev, ...data.filter((e) => !seen.has(e.enrollmentId))];
				});
				setHasMoreEnrollments(data.length === ENROLLMENT_PAGE_SIZE);
				setEnrollmentsPage(page + 1);
			} catch {
				toast({
					title: "Error",
					description: "Failed to load enrollments",
					variant: "destructive",
				});
			} finally {
				setLoadingEnrollments(false);
			}
		},
		[loadingEnrollments, hasMoreEnrollments, enrollmentsPage, enrollmentSearch]
	);

	useEffect(() => {
		if (!isOpen) {
			// Drop the cached list so a reopened modal shows fresh data.
			setEnrollments([]);
			setEnrollmentsPage(1);
			setHasMoreEnrollments(true);
			setEnrollmentSearch("");
			return;
		}
		fetchEnrollments(true, "");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	useEffect(() => {
		return () => {
			if (enrollmentSearchTimer.current)
				clearTimeout(enrollmentSearchTimer.current);
		};
	}, []);

	const handleEnrollmentSearch = useCallback(
		(query: string) => {
			if (enrollmentSearchTimer.current)
				clearTimeout(enrollmentSearchTimer.current);
			enrollmentSearchTimer.current = setTimeout(() => {
				setEnrollmentSearch(query);
				setHasMoreEnrollments(true);
				fetchEnrollments(true, query);
			}, 350);
		},
		[fetchEnrollments]
	);

	// When editing, the linked enrollment may sit beyond page 1 (or outside the
	// current search), so fetch it directly to keep its label visible.
	const resolvedEnrollmentIds = useRef<Set<number>>(new Set());

	useEffect(() => {
		if (!isOpen) {
			resolvedEnrollmentIds.current.clear();
			return;
		}
		const id = values.enrollmentId;
		if (!id || resolvedEnrollmentIds.current.has(id)) return;
		resolvedEnrollmentIds.current.add(id);

		let cancelled = false;
		getEnrollmentById(id)
			.then((res) => {
				const row = res?.data;
				if (cancelled || !row) return;
				setEnrollments((prev) =>
					prev.some((e) => e.enrollmentId === row.enrollmentId)
						? prev
						: [row, ...prev]
				);
			})
			.catch(() => { });

		return () => {
			cancelled = true;
		};
	}, [isOpen, values.enrollmentId]);

	const enrollmentOptions = useMemo(
		() => [
			{ label: "— None —", value: null },
			...enrollments.map((e) => ({
				label: enrollmentLabel(e),
				value: e.enrollmentId,
			})),
		],
		[enrollments]
	);

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
		if (!values.transactionDate) errs.transactionDate = "Date is required";
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
		{ name: "transactionDate", label: "Transaction Date", type: "Date", required: true },
		{ name: "amount", label: "Amount", type: "number", required: true },
		{ name: "formReferenceNo", label: "Reference No", type: "text" },
		{
			name: "entrySource", label: "Entry Source", type: "select",
			options: entrySourceOptions.map((e) => ({ label: e.value, value: e.value })),
			disabled: true
		},
		{
			name: "enrollmentId",
			label: "Enrollment",
			type: "select",
			options: enrollmentOptions,
			placeholder: "Select enrollment (latest first)",
			onSearch: handleEnrollmentSearch,
			onLoadMore: () => fetchEnrollments(),
			isLoadingMore: loadingEnrollments,
		},

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