import { useCallback, useEffect, useState } from "react";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { updateUser, signup } from "@/api/user.api";
import type { User } from "@/types/user";
import { toast } from "@/hooks/use-toast";
import type { FormFieldConfig } from "@/components/form-modal/types";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

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

	useEffect(() => {
		setValues({ ...empty, ...(initialData ?? {}), password: "" });
		setFieldErrors({});
		setError(null);
	}, [initialData, isOpen]);

	const onChange = (field: keyof User, val: any) => {
		setValues((p) => ({ ...p, [field]: val }));
	};

	// --- Logic for Access JSON Management ---
	const addAccessRow = () => {
		const current = Array.isArray(values.access) ? [...values.access] : [];
		current.push({ resource: "", actions: ["read"] });
		onChange("access", current);
	};

	const removeAccessRow = (index: number) => {
		const current = [...(values.access as any[])];
		current.splice(index, 1);
		onChange("access", current);
	};

	const updateAccessRow = (index: number, field: string, val: any) => {
		const current = [...(values.access as any[])];
		current[index] = { ...current[index], [field]: val };
		onChange("access", current);
	};

	const toggleAction = (index: number, action: string) => {
		const current = [...(values.access as any[])];
		const actions = [...current[index].actions];
		if (actions.includes(action)) {
			const filtered = actions.filter((a) => a !== action);
			updateAccessRow(index, "actions", filtered);
		} else {
			actions.push(action);
			updateAccessRow(index, "actions", actions);
		}
	};

	const handleSubmit = useCallback(async () => {
		setIsSubmitting(true);
		try {
			const payload = { ...values };
			if (!payload.password) delete (payload as any).password;

			const res = initialData?.userId
				? await updateUser(initialData.userId, payload)
				: await signup(payload as any);

			if (res.success) {
				toast({ title: "Success", description: `User ${initialData ? 'updated' : 'created'} successfully` });
				onSave();
				onClose();
			} else {
				setError(res.message || "Operation failed");
			}
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsSubmitting(false);
		}
	}, [values, initialData, onSave, onClose]);

	const fields: FormFieldConfig<User>[] = [
		{ name: "username", label: "Username", type: "text", required: true },
		{ name: "email", label: "Email", type: "email", required: true },
		{ name: "password", label: initialData ? "Password (Leave blank to keep)" : "Password", type: "password", required: !initialData },
		{
			name: "role",
			label: "System Role",
			type: "select",
			options: [
				{ label: "Staff", value: "staff" },
				{ label: "Admin", value: "admin" }
			]
		},
		{
			name: "access" as any,
			label: "Custom Access Rights (JSON)",
			render: () => (
				<div className="space-y-3 border rounded-lg p-4 bg-muted/20">
					<div className="flex justify-between items-center mb-2">
						<span className="text-sm font-medium">Permissions</span>
						<Button type="button" variant="outline" size="sm" onClick={addAccessRow}>
							<Plus className="w-3 h-3 mr-1" /> Add Resource
						</Button>
					</div>
					{Array.isArray(values.access) && (values.access as any[]).map((acc, idx) => (
						<div key={idx} className="flex flex-col gap-2 p-3 bg-background border rounded-md relative group">
							<Button
								variant="ghost" size="icon"
								className="absolute right-1 top-1 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
								onClick={() => removeAccessRow(idx)}
							>
								<Trash2 className="w-4 h-4" />
							</Button>
							<Input
								placeholder="Resource (e.g. users, areas)"
								value={acc.resource}
								onChange={(e) => updateAccessRow(idx, "resource", e.target.value)}
								className="h-8"
							/>
							<div className="flex gap-4 mt-1">
								{['read', 'create', 'update', 'delete'].map((act) => (
									<div key={act} className="flex items-center space-x-2">
										<Checkbox
											id={`act-${idx}-${act}`}
											checked={acc.actions.includes(act)}
											onCheckedChange={() => toggleAction(idx, act)}
										/>
										<label htmlFor={`act-${idx}-${act}`} className="text-xs capitalize cursor-pointer">{act}</label>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			)
		}
	];

	return (
		<Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-3xl p-0 overflow-hidden">
				<div className="flex flex-col max-h-[90vh]">
					<FormHeader title={initialData?.userId ? "Edit User" : "Create User"} onClose={onClose} />
					<div className="flex-1 overflow-y-auto p-1">
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
					<FormFooter onClose={onClose} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
				</div>
			</DialogContent>
		</Dialog>
	);
}