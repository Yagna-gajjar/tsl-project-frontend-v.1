import { useCallback, useEffect, useState } from "react";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { updateUser, signup } from "@/api/user.api";
import type { User } from "@/types/user";
import { toast } from "@/hooks/use-toast";
import type { FormFieldConfig } from "@/components/form-modal/types";
import type { Member } from "@/types/member";
import { getMembers } from "@/api/member.api";
import type { Response } from "@/types/response";

type Props = {
	isOpen: boolean;
	initialData?: User;
	onClose: () => void;
	onSave: () => void;
};

const empty: User = {
	username: "",
	email: "",
	password: "",
	role: "staff",
	memberId: undefined,
	access: [],
} as any;

export default function UserFormModal({ isOpen, initialData, onClose, onSave }: Props) {
	const [values, setValues] = useState<User>(empty);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [error, setError] = useState<string | null>(null);
	const [members, setMembers] = useState<Member[]>([]);

	// Fetch members when the modal opens
	useEffect(() => {
		if (isOpen) {
			const fetchMembers = async () => {
				try {
					const mRes: Response<Member[]> = await getMembers({ limit: 1000 });
					if (mRes.success) {
						setMembers(mRes?.data || []);
					}
				} catch {
					toast({
						title: "Error",
						description: "Failed to fetch members list",
						variant: "destructive"
					});
				}
			};
			fetchMembers();
		}
	}, [isOpen]);

	// Reset form values when initialData changes or modal opens
	useEffect(() => {
		if (isOpen) {
			setValues({ ...empty, ...(initialData ?? {}), password: "" });
			setFieldErrors({});
			setError(null);
		}
	}, [initialData, isOpen]);

	const onChange = (field: keyof User, val: any) => {
		setValues((p) => ({ ...p, [field]: val }));
		// Clear field error when user starts typing
		if (fieldErrors[field as string]) {
			setFieldErrors((prev) => {
				const newErrs = { ...prev };
				delete newErrs[field as string];
				return newErrs;
			});
		}
	};

	const validate = () => {
		const errs: Record<string, string> = {};
		if (!values.username?.trim()) errs.username = "Username is required";
		if (!values.email?.trim()) errs.email = "Email is required";
		if (!initialData && !values.password) errs.password = "Password is required";
		return errs;
	};

	const handleSubmit = useCallback(async () => {
		const errs = validate();
		if (Object.keys(errs).length > 0) {
			setFieldErrors(errs);
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			const payload = { ...values };
			// Don't send empty password string on update
			if (!payload.password) delete (payload as any).password;

			const res = initialData?.userId
				? await updateUser(initialData.userId, payload)
				: await signup(payload as any);

			if (res.success) {
				toast({
					title: "Success",
					description: `User ${initialData ? 'updated' : 'created'} successfully`
				});
				onSave();
				onClose();
			} else {
				setError(res.message || "Operation failed");
			}
		} catch (err: any) {
			setError(err.message || "An unexpected error occurred");
		} finally {
			setIsSubmitting(false);
		}
	}, [values, initialData, onSave, onClose]);

	const fields: FormFieldConfig<User>[] = [
		{ name: "username", label: "Username", type: "text", required: true },
		{ name: "email", label: "Email", type: "email", required: true },
		{
			name: "memberId",
			label: "Linked Member",
			type: "select",
			options: members.map(m => ({
				label: `${m.memberFirstName} ${m.memberLastName}`,
				value: m.memberId
			}))
		},
		{
			name: "password",
			label: initialData ? "New Password (Leave blank to keep)" : "Password",
			type: "password",
			required: !initialData
		},
		{
			name: "role",
			label: "System Role",
			type: "select",
			options: [
				{ label: "Staff", value: "staff" },
				{ label: "Admin", value: "admin" },
				{ label: "Member", value: "member" },
				{ label: "Coach", value: "coach" }
			]
		}
	];

	return (
		<Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-3xl p-0 overflow-hidden border-none shadow-2xl">
				<div className="flex flex-col max-h-[90vh] bg-background">
					<FormHeader
						title={initialData?.userId ? "Edit User Profile" : "Create New User"}
						onClose={onClose}
					/>

					<div className="flex-1 overflow-y-auto px-6 py-4">
						<FormContent
							fields={fields}
							values={values}
							onChange={onChange}
							isSubmitting={isSubmitting}
							errors={fieldErrors}
							layout="grid"
							error={error}
							loading={false}
						/>
					</div>

					<FormFooter
						onClose={onClose}
						onSubmit={handleSubmit}
						isSubmitting={isSubmitting}
						submitLabel={initialData?.userId ? "Update User" : "Create User"}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}