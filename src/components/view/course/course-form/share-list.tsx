import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CourseShare } from "@/types/courseShare";
import type { Entity } from "@/types/entity";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SharesListProps {
	shares: CourseShare[];
	entityOptions: Entity[];
	errors: Record<string, string>;
	onChange: (index: number, field: keyof CourseShare, value: any) => void;
	onRemove: (index: number) => void;
}

export const SharesList = ({
	shares,
	entityOptions,
	onChange,
	onRemove,
}: SharesListProps) => {
	const handleKeyDown = (
		e: React.KeyboardEvent,
		index: number,
		isLastField: boolean
	) => {
		if (
			e.key === "Tab" &&
			!e.shiftKey &&
			isLastField &&
			index === shares.length - 1
		) {
			e.preventDefault();
			// Add new share when Tab on last field of last row
			// This will trigger the parent's addArrayItem function if called with a dummy value for a required field
			onChange(shares.length, "entityId", 0); // Trigger add via parent by changing an empty share
			// Attempt to focus the first field of the newly added row
			setTimeout(() => {
				const nextInput = document.querySelector<HTMLInputElement>(
					`#share_${shares.length}_entityId`
				);
				if (nextInput) {
					nextInput.focus();
				}
			}, 100);
		}
	};

	return (
		<div className="space-y-1">
			<div className="grid grid-cols-[2fr,1.5fr,1fr,0.6fr,0.6fr,1fr,60px] gap-1 px-2 py-1 bg-muted/50 text-xs font-semibold border-b">
				<div>Entity*</div>
				<div>Role In Course*</div>
				<div>Share (%)*</div>
				<div className="text-center">CGST</div>
				<div className="text-center">SGST</div>
				<div className="text-center">Approval Authority</div>
				<div />
			</div>

			<AnimatePresence mode="popLayout">
				{shares.map((share, index) => (
					<motion.div
						key={index}
						layout
						className="grid grid-cols-[2fr,1.5fr,1fr,0.6fr,0.6fr,1fr,60px] gap-1 px-2 py-1 border-b hover:bg-muted/30 items-center"
					>
						{/* Entity */}
						<Select
							value={String(share.entityId || "")}
							onValueChange={(v) => onChange(index, "entityId", Number(v))}
						>
							<SelectTrigger className="h-8 text-xs">
								<SelectValue placeholder="Select Entity" />
							</SelectTrigger>
							<SelectContent>
								{entityOptions.map((a) => (
									<SelectItem key={a.entityId} value={String(a.entityId)}>
										{a.entityName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* Role In Course */}
						<Input
							className="h-8 text-xs"
							value={share.roleInCourse}
							onChange={(e) => onChange(index, "roleInCourse", e.target.value)}
							disabled={share.roleInCourse === "TSL Charges"}
						/>

						{/* Share */}
						<Input
							type="number"
							min={0}
							max={100}
							className={cn(
								"h-8 text-xs",
								share.roleInCourse === "TSL Charges" &&
								"text-primary font-semibold"
							)}
							value={share.share}
							onChange={(e) => onChange(index, "share", Number(e.target.value))}
						/>

						{/* CGST */}
						<Input
							type="number"
							className={cn(
								"h-8 text-xs",
								share.roleInCourse === "TSL Charges" &&
								"text-primary font-semibold"
							)}
							onChange={(v) => onChange(index, "cgst", Number(v.target.value))}
						/>

						{/* SGST */}
						<Input
							type="number"
							className={cn(
								"h-8 text-xs",
								share.roleInCourse === "TSL Charges" &&
								"text-primary font-semibold"
							)}
							onChange={(v) => onChange(index, "sgst", Number(v.target.value))}
						/>

						{/* Approval Authority */}
						<Input
							type="number"
							className={cn("h-8 text-xs text-primary font-semibold")}
							onChange={(v) =>
								onChange(index, "approvalAuthorityId", Number(v.target.value))
							}
						/>

						{/* Delete */}
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
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);
};