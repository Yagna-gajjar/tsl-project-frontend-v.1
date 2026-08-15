import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Settings2, Receipt, IndianRupee } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAppSettings } from "@/contexts/appSettingsContext";

export default function GeneralSettingsPage() {
	const { gstEnabled, processingCharge, isLoading, setGstEnabled, setProcessingCharge } = useAppSettings();
	const [isUpdating, setIsUpdating] = useState(false);
	const [procChargeInput, setProcChargeInput] = useState(String(processingCharge));
	const [isSavingProcCharge, setIsSavingProcCharge] = useState(false);

	useEffect(() => {
		setProcChargeInput(String(processingCharge));
	}, [processingCharge]);

	const handleToggle = async (checked: boolean) => {
		setIsUpdating(true);
		try {
			await setGstEnabled(checked);
			toast({
				title: "Success",
				description: `GST is now ${checked ? "enabled" : "disabled"} for new enrollments.`,
			});
		} catch {
			toast({ title: "Error", description: "Failed to update setting.", variant: "destructive" });
		} finally {
			setIsUpdating(false);
		}
	};

	const handleSaveProcessingCharge = async () => {
		const amount = Number(procChargeInput);
		if (Number.isNaN(amount) || amount < 0) {
			toast({ title: "Error", description: "Enter a valid amount.", variant: "destructive" });
			return;
		}
		setIsSavingProcCharge(true);
		try {
			await setProcessingCharge(amount);
			toast({
				title: "Success",
				description: `Default processing charge set to ₹${amount}.`,
			});
		} catch {
			toast({ title: "Error", description: "Failed to update setting.", variant: "destructive" });
		} finally {
			setIsSavingProcCharge(false);
		}
	};

	return (
		<div className="p-6 max-w-[1000px] mx-auto space-y-8 min-h-screen">
			<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
				<div className="flex items-center gap-3 mb-1">
					<Settings2 className="w-8 h-8 text-primary" />
					<h1 className="text-3xl font-black tracking-tighter">General Settings</h1>
				</div>
				<p className="text-muted-foreground text-sm font-medium">
					System-wide configuration that affects the whole application.
				</p>
			</motion.div>

			<Card className="border-2">
				<CardHeader className="pb-4">
					<div className="flex items-center gap-2">
						<Receipt className="w-5 h-5 text-primary" />
						<CardTitle className="text-lg font-extrabold tracking-tight">Apply GST on Enrollments</CardTitle>
					</div>
					<CardDescription>
						When off, CGST/SGST are not charged on new enrollments, even though each course's
						configured tax rate is kept as-is for later use.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between p-4 rounded-xl border bg-background/50">
						<span className="text-sm font-bold">
							{gstEnabled ? "GST is currently applied" : "GST is currently not applied"}
						</span>
						<Switch
							checked={gstEnabled}
							onCheckedChange={handleToggle}
							disabled={isLoading || isUpdating}
						/>
					</div>
				</CardContent>
			</Card>

			<Card className="border-2">
				<CardHeader className="pb-4">
					<div className="flex items-center gap-2">
						<IndianRupee className="w-5 h-5 text-primary" />
						<CardTitle className="text-lg font-extrabold tracking-tight">Default Processing Charge</CardTitle>
					</div>
					<CardDescription>
						The default TSL processing charge (₹) pre-filled on the enrollment Billing step. The
						operator can still override it per enrollment.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3 p-4 rounded-xl border bg-background/50">
						<Input
							type="number"
							min={0}
							value={procChargeInput}
							onChange={(e) => setProcChargeInput(e.target.value)}
							disabled={isLoading || isSavingProcCharge}
							className="max-w-[160px]"
						/>
						<Button
							onClick={handleSaveProcessingCharge}
							disabled={isLoading || isSavingProcCharge || procChargeInput === String(processingCharge)}
						>
							Save
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
