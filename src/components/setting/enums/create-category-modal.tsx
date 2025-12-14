"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEnum } from "@/api/enums.api";
import { toast } from "@/hooks/use-toast";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export function CreateCategoryModal({ isOpen, onClose, onSuccess }: Props) {
	const [category, setCategory] = useState("");
	const [firstValue, setFirstValue] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		if (!category.trim() || !firstValue.trim()) return;

		setLoading(true);
		try {
			const res: any = await createEnum({
				category: category.trim(),
				value: firstValue.trim()
			} as any);

			if (res?.success) {
				toast({ title: "Created", description: "New category created successfully.", variant:"success" });
				onSuccess();
				onClose();
				setCategory("");
				setFirstValue("");
			}
		} catch {
			toast({ title: "Error", variant: "destructive", description: "Failed to create category." });
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Create New Category</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>Category Name</Label>
						<Input
							placeholder="e.g. UserRoles, ProjectStatus"
							value={category}
							onChange={(e) => setCategory(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label>Initial Value</Label>
						<Input
							placeholder="e.g. Admin, Active"
							value={firstValue}
							onChange={(e) => setFirstValue(e.target.value)}
						/>
						<p className="text-xs text-muted-foreground">
							A category must have at least one value to be initialized.
						</p>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>Cancel</Button>
					<Button onClick={handleSubmit} disabled={loading || !category || !firstValue}>
						{loading ? "Creating..." : "Create Category"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}