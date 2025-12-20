import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Activity } from "@/types/activity";
import type { CoursePackage } from "@/types/coursePackage";
import { motion, AnimatePresence } from "framer-motion"
import { Trash2 } from "lucide-react";

interface PackagesListProps {
	packages: CoursePackage[];
	activityOptions: Activity[];
	errors: Record<string, string>;
	onChange: (index: number, field: keyof CoursePackage, value: any) => void;
	onRemove: (index: number) => void;
}

export const PackagesList = ({
	packages,
	activityOptions,
	errors,
	onChange,
	onRemove,
}: PackagesListProps) => {
	const handleKeyDown = (
		e: React.KeyboardEvent,
		index: number,
		isLastField: boolean
	) => {
		if (
			e.key === "Tab" &&
			!e.shiftKey &&
			isLastField &&
			index === packages.length - 1
		) {
			e.preventDefault();
			// Add new package when Tab on last field of last row
			// This will trigger the parent's addArrayItem function if called with a dummy value for a required field
			onChange(packages.length, "activityId", 0); // Trigger add via parent by changing an empty package
			// Attempt to focus the first field of the newly added row
			setTimeout(() => {
				const nextInput = document.querySelector<HTMLInputElement>(
					`#pkg_${packages.length}_activityId`
				);
				if (nextInput) {
					nextInput.focus();
				}
			}, 100);
		}
	};

	return (
		<div className="space-y-1">
			<div className="grid grid-cols-[1fr,1fr,1fr,60px] gap-1 px-2 py-1 bg-muted/50 text-xs font-semibold border-b">
				<div>Activity</div>
				<div>Link Type*</div>
				<div>Approval Authority id</div>
				<div></div>
			</div>

			<AnimatePresence mode="popLayout">
				{packages.map((pkg, index) => (
					<motion.div
						key={index}
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, x: -50 }}
						transition={{ duration: 0.15 }}
						layout
						className="grid grid-cols-[1fr,1fr,1fr,60px] gap-1 px-2 py-1 border-b hover:bg-muted/30 items-center"
					>
						<div>
							<Select
								value={String(pkg.activityId || "")}
								onValueChange={(v) => onChange(index, "activityId", Number(v))}
							>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue placeholder="Select Activity" />
								</SelectTrigger>
								<SelectContent>
									{activityOptions.map((a) => (
										<SelectItem key={a.activityId} value={String(a.activityId)}>
											{a.activityName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors[`package_${index}_activityId`] && (
								<p className="text-[10px] text-destructive mt-0.5">
									{errors[`package_${index}_activityId`]}
								</p>
							)}
						</div>

						<div>
							<Select
								value={pkg.linkType}
								onValueChange={(v) => {
									onChange(index, "linkType", v);
								}}
							>
								<SelectTrigger className="h-8 text-xs">
									<SelectValue placeholder="Select Link Type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Pre">Pre</SelectItem>
									<SelectItem value="post">Post</SelectItem>
								</SelectContent>
							</Select>
							{errors[`package_${index}_linkType`] && (
								<p className="text-[10px] text-destructive mt-0.5">
									{errors[`package_${index}_linkType`]}
								</p>
							)}
						</div>

						<Input
							type="number"
							className={cn("h-8 text-xs text-primary font-semibold")}
							onChange={(v) =>
								onChange(index, "approvalAuthorityId", Number(v.target.value))
							}
						/>

						<div className="flex justify-center">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => onRemove(index)}
								className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
								onKeyDown={(e) => handleKeyDown(e, index, true)}
							>
								<Trash2 className="w-3 h-3" />
							</Button>
						</div>
					</motion.div>
				))}
			</AnimatePresence>

			{packages.length === 0 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="text-center py-8 text-muted-foreground text-sm"
				>
					<p>No packages added yet. Click "Add Package" to get started.</p>
				</motion.div>
			)}
		</div>
	);
};