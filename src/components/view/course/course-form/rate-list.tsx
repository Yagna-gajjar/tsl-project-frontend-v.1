import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CourseRate } from "@/types/courseRate";
import type { MembershipMaster } from "@/types/memberShipMaster";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";

interface RatesListProps {
	rates: CourseRate[];
	entityTypeOptions: MembershipMaster[];
	errors: Record<string, string>;
	onChange: (index: number, field: keyof CourseRate, value: any) => void;
	onRemove: (index: number) => void;
}

export const RatesList = ({
	rates,
	entityTypeOptions,
	onChange,
	onRemove,
}: RatesListProps) => {
	const handleKeyDown = (
		e: React.KeyboardEvent,
		index: number,
		isLastField: boolean
	) => {
		if (
			e.key === "Tab" &&
			!e.shiftKey &&
			isLastField &&
			index === rates.length - 1
		) {
			e.preventDefault();
			onChange(rates.length, "unitRate", 0);
			setTimeout(() => {
				const nextInput = document.querySelector<HTMLInputElement>(
					`#rate_${rates.length}_membershipMasterId`
				);
				if (nextInput) {
					nextInput.focus();
				}
			}, 100);
		}
	};

	return (
		<div className="space-y-1">
			<div className="grid text-center grid-cols-[0.8fr,0.3fr,0.3fr,0.7fr,0.7fr,0.3fr,0.3fr,0.3fr,0.6fr,0.3fr,0.6fr,20px] items-center gap-1 px-2 py-1 bg-muted/50 text-xs font-semibold border-b">
				<div>Membership Type</div>
				<div>Above Units</div>
				<div>Unit Rate*</div>
				<div>Introduce Date*</div>
				<div>suspension Date*</div>
				<div>Day Selection</div>
				<div>Enr Changes Allowed</div>
				<div>Enr Freezing Allowed</div>
				<div>min Days In Enr</div>
				<div>discount On Day Reduce</div>
				<div>status</div>
				<div></div>
			</div>

			<AnimatePresence mode="popLayout">
				{rates.map((rate, index) => (
					<motion.div
						key={index}
						layout
						className="grid grid-cols-[0.8fr,0.3fr,0.3fr,0.7fr,0.7fr,0.3fr,0.3fr,0.3fr,0.6fr,0.3fr,0.6fr,20px] gap-1 px-2 py-1 border-b items-center"
					>
						{/* Membership Type */}
						<Select
							value={String(rate.membershipMasterId)}
							onValueChange={(v) =>
								onChange(index, "membershipMasterId", Number(v))
							}
						>
							<SelectTrigger className="h-8 text-xs">
								<SelectValue placeholder="Select" />
							</SelectTrigger>
							<SelectContent>
								{entityTypeOptions?.map((e) => (
									<SelectItem
										key={e.membershipMasterId}
										value={String(e.membershipMasterId)}
									>
										{e.membershipType}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* Above Units */}
						<Input
							type="number"
							className="h-8 text-xs"
							value={rate.aboveUnits}
							onChange={(e) =>
								onChange(index, "aboveUnits", Number(e.target.value))
							}
						/>

						{/* Unit Rate */}
						<Input
							type="number"
							className="h-8 text-xs"
							value={rate.unitRate}
							onChange={(e) =>
								onChange(index, "unitRate", Number(e.target.value))
							}
						/>

						{/* Introduce Date */}
						<Input
							type="date"
							className="h-8 text-xs"
							value={rate.introduceDate}
							onChange={(e) => onChange(index, "introduceDate", e.target.value)}
						/>

						{/* Suspension Date */}
						<Input
							type="date"
							className="h-8 text-xs"
							value={rate.suspensionDate as string || ""}
							onChange={(e) =>
								onChange(index, "suspensionDate", e.target.value)
							}
						/>

						{/* Day Selection */}
						<div className="flex justify-center">
							<Checkbox
								checked={rate.daySelection}
								onCheckedChange={(v) =>
									onChange(index, "daySelection", Boolean(v))
								}
							/>
						</div>
						{/* Enr Changes Allowed */}
						<Input
							type="number"
							className="h-8 text-xs"
							value={rate.enrChangesAllowed}
							onChange={(e) =>
								onChange(index, "enrChangesAllowed", Number(e.target.value))
							}
						/>

						{/* Enr Freezing Allowed */}
						<Input
							type="number"
							className="h-8 text-xs"
							value={rate.enrFreezingAllowed}
							onChange={(e) =>
								onChange(index, "enrFreezingAllowed", Number(e.target.value))
							}
						/>
						{/* Min Days In Enr */}
						<Input
							type="number"
							className="h-8 text-xs"
							value={rate.minDaysInEnr}
							onChange={(e) =>
								onChange(index, "minDaysInEnr", Number(e.target.value))
							}
						/>

						{/* Discount On Day Reduce */}
						<Input
							type="number"
							className="h-8 text-xs"
							value={rate.discountOnDayReduce}
							onChange={(e) =>
								onChange(index, "discountOnDayReduce", Number(e.target.value))
							}
						/>

						{/* Status */}
						<Select
							value={rate.status}
							onValueChange={(v) => onChange(index, "status", v)}
						>
							<SelectTrigger className="h-8 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="inactive">Inactive</SelectItem>
							</SelectContent>
						</Select>

						{/* Delete */}
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => onRemove(index)}
							className="h-6 w-6 p-0"
							onKeyDown={(e) => handleKeyDown(e, index, true)}
						>
							<Trash2 className="w-3 h-3" />
						</Button>
					</motion.div>
				))}
			</AnimatePresence>

			{rates.length === 0 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="text-center py-8 text-muted-foreground text-sm"
				>
					<p>No rates added yet. Click "Add Rate" to get started.</p>
				</motion.div>
			)}
		</div>
	);
};