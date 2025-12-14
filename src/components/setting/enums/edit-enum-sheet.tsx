"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"; // 1. Added Select imports
import { createEnum, updateEnum, deleteEnum } from "@/api/enums.api";
import { toast } from "@/hooks/use-toast";
import { Trash2, Loader2 } from "lucide-react";
import type { Enums as EnumItem } from "@/types/enums";
import { getAccounts } from "@/api/account.api";
import type { Response } from "@/types/response";
import type { Account } from "@/types/account";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	initialData: EnumItem | null;
	initialCategory: string;
	onSaved: () => void;
}

export function EditEnumSheet({ isOpen, onClose, initialData, initialCategory, onSaved }: Props) {
	const isEdit = !!initialData;
	const [loading, setLoading] = useState(false);
	const [casualAcc, setCasualAcc] = useState<Account[]>([]);
	const [formData, setFormData] = useState<Partial<EnumItem>>({
		category: "",
		value: "",
		description: "",
		status: true
	});

	useEffect(() => {
		async function fetchCasualAccounts() {
			try {
				const res: Response<Account[]> = await getAccounts({
					name: "casual"
				});

				if (res.success) {
					setCasualAcc(res?.data || []);
				} else {
					setCasualAcc([]);
				}
			} catch {
				toast({
					title: "Error",
					description: "Failed to fetch casual accounts.",
					variant: "destructive"
				});
			}
		}

		const currentCategory = initialData?.category || initialCategory || formData.category;

		if (currentCategory === "casual_account") {
			fetchCasualAccounts();
		}
	}, [initialData, initialCategory, formData.category]);

	useEffect(() => {
		if (isOpen) {
			if (initialData) {
				setFormData({ ...initialData });
			} else {
				setFormData({
					category: initialCategory,
					value: "",
					description: "",
					status: true
				});
			}
		}
	}, [isOpen, initialData, initialCategory]);

	const handleSave = async () => {
		setLoading(true);
		try {
			const payload = {
				category: formData.category,
				value: formData.value,
				description: formData.description,
				status: formData.status
			};

			let res: any;
			if (isEdit && initialData?.id) {
				res = await updateEnum(initialData.id, payload);
			} else {
				res = await createEnum(payload as any);
			}

			if (res?.success) {
				toast({ title: "Success", description: "Saved successfully", variant: "default" }); // Changed variant to default or success depending on your toast setup
				onSaved();
				onClose();
			}
		} catch (e) {
			toast({ title: "Error", description: "Failed to save", variant: "destructive" });
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!initialData?.id) return;
		setLoading(true);
		try {
			await deleteEnum(initialData.id);
			toast({ title: "Deleted", description: "Item removed successfully", variant: "default" });
			onSaved();
			onClose();
		} catch {
			toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
		} finally {
			setLoading(false);
		}
	};

	return (
		<Sheet open={isOpen} onOpenChange={onClose}>
			<SheetContent className="w-[400px] sm:w-[540px]">
				<SheetHeader>
					<SheetTitle>{isEdit ? "Edit Enum" : "New Enum"}</SheetTitle>
					<SheetDescription>
						{isEdit ? "Update details for this lookup value." : "Add a new lookup value to the system."}
					</SheetDescription>
				</SheetHeader>

				<div className="py-6 space-y-6">

					{/* Category Input */}
					<div className="space-y-2">
						<Label htmlFor="category">Category</Label>
						<Input
							id="category"
							value={formData.category}
							onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
							placeholder="e.g. UserRole"
						// Optional: Disable category edit if it's casual_account to prevent breaking the dropdown logic
						// disabled={formData.category === "casual_account"} 
						/>
						<p className="text-[11px] text-muted-foreground">
							Changing this will move the item to a different group.
						</p>
					</div>

					{/* 3. Conditional Value Input */}
					<div className="space-y-2">
						<Label htmlFor="value">Value</Label>

						{formData.category === "casual_account" ? (
							// Dropdown for casual_account
							<Select
								value={formData.value}
								onValueChange={(val) => setFormData(prev => ({ ...prev, value: val }))}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select Account" />
								</SelectTrigger>
								<SelectContent>
									{casualAcc.length > 0 ? (
										casualAcc.map((acc) => (
											<SelectItem key={acc.accountId} value={String(acc.accountId)}>
												{/* Display Name but value is ID */}
												{acc.name || `Account ${acc.accountId}`}
											</SelectItem>
										))
									) : (
										<div className="p-2 text-sm text-muted-foreground text-center">
											No casual accounts found
										</div>
									)}
								</SelectContent>
							</Select>
						) : (
							// Standard Input for everything else
							<Input
								id="value"
								value={formData.value}
								onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
								placeholder="e.g. Admin"
							/>
						)}

						{formData.category === "casual_account" && (
							<p className="text-[11px] text-muted-foreground">
								Selected Account ID will be saved as the Enum Value.
							</p>
						)}
					</div>

					{/* Description Input */}
					<div className="space-y-2">
						<Label htmlFor="desc">Description</Label>
						<Textarea
							id="desc"
							value={formData.description || ""}
							onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
							placeholder="Optional description..."
							className="resize-none h-24"
						/>
					</div>

					{/* Status Toggle */}
					<div className="flex items-center justify-between border p-3 rounded-lg bg-slate-50 dark:bg-zinc-900">
						<div className="space-y-0.5">
							<Label>Status</Label>
							<div className="text-[12px] text-muted-foreground">
								{formData.status ? "Active (Visible in app)" : "Inactive (Hidden)"}
							</div>
						</div>
						<Switch
							checked={formData.status}
							onCheckedChange={c => setFormData(prev => ({ ...prev, status: c }))}
						/>
					</div>
				</div>

				<SheetFooter className="flex justify-between items-center sm:justify-between gap-2">
					{isEdit ? (
						<Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
							<Trash2 className="w-4 h-4 mr-2" /> Delete
						</Button>
					) : <div></div>}

					<div className="flex gap-2">
						<Button variant="outline" onClick={onClose}>Cancel</Button>
						<Button onClick={handleSave} disabled={loading || !formData.category || !formData.value}>
							{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
							Save Changes
						</Button>
					</div>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}