import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
	UserPlus,
	ShieldCheck,
	Settings2,
	Coins,
	MessageSquareQuote,
	Loader2,
	Building2
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import type { Enrollment as EnrollmentData } from "@/types/enrollment"
import { toast } from "@/hooks/use-toast"
import type { Response } from "@/types/response"
import { getAccounts } from "@/api/account.api"
import type { Account } from "@/types/account"

interface ConfirmTabProps {
	data?: EnrollmentData
	onUpdate: (data: Partial<EnrollmentData>) => void
}

export function ConfirmTab({ data, onUpdate }: ConfirmTabProps) {
	const [formData, setFormData] = useState({
		walkingName: data?.walkingName || "",
		walkingContact: data?.walkingContact || "",
		officeRemarks: data?.officeRemarks || "",
		printRemarks: data?.printRemarks || "",
		dnAccountId: data?.dnAccountId ? String(data.dnAccountId) : "",
		dnOrDiscount: data?.dnOrDiscount || 0,
		processingCharge: data?.processingCharge || 0,
		academyApprovalStatus: data?.academyApprovalStatus || "not required",
		status: data?.status || "created",
	});

	const [dnAccounts, setDnAccounts] = useState<Account[]>([]);
	const [isAccountsLoading, setIsAccountsLoading] = useState(false);

	const handleChange = (name: string, value: string | number) => {
		const updated = { ...formData, [name]: value }
		console.log(updated);
		setFormData(updated)

		onUpdate(updated as any)
	}

	const fetchAccountsForDN = async () => {
		setIsAccountsLoading(true);
		try {
			const aRes: Response<Account[]> = await getAccounts({
				accountType: "Expences"
			});
			if (aRes.success) {
				setDnAccounts(aRes?.data || []);
			} else {
				throw new Error("failed to fetch accounts");
			}
		} catch {
			toast({
				title: "Error",
				description: "Failed to fetch expense accounts.",
				variant: "destructive"
			})
		} finally {
			setIsAccountsLoading(false);
		}
	}

	useEffect(() => {
		fetchAccountsForDN();
	}, []);

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="space-y-6 pb-6"
		>
			<header className="flex items-center gap-3">
				<div className="p-2 bg-primary/10 rounded-lg text-primary">
					<ShieldCheck className="w-6 h-6" />
				</div>
				<div>
					<h2 className="text-2xl font-bold dark:text-slate-100 uppercase tracking-tight">Billing & Finalization</h2>
					<p className="text-sm text-muted-foreground">Adjust adjustments, charges, and internal remarks.</p>
				</div>
			</header>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

				<Card className="p-5 space-y-4 shadow-sm border-border/60 bg-card/50">
					<div className="flex items-center gap-2 border-b pb-2">
						<UserPlus className="w-4 h-4 text-primary" />
						<h3 className="font-bold text-sm uppercase tracking-wider text-primary">Walking Information</h3>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label className="text-sm font-semibold">Walking Name</Label>
							<Input
								placeholder="Enter Full Name"
								value={formData.walkingName}
								onChange={(e) => handleChange("walkingName", e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-semibold">Walking Contact</Label>
							<Input
								placeholder="Contact Number"
								value={formData.walkingContact}
								onChange={(e) => handleChange("walkingContact", e.target.value)}
							/>
						</div>
					</div>
				</Card>

				<Card className="p-5 space-y-4 shadow-sm border-border/60 bg-card/50">
					<div className="flex items-center gap-2 border-b pb-2 text-blue-500">
						<Settings2 className="w-4 h-4" />
						<h3 className="font-bold text-sm uppercase tracking-wider">Workflow & Status</h3>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label className="text-xs font-semibold">Academy Approval</Label>
							<Select value={formData?.academyApprovalStatus as string} onValueChange={(v) => handleChange("academyApprovalStatus", v)}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="required">Required</SelectItem>
									<SelectItem value="not required">Not Required</SelectItem>
									<SelectItem value="approved">Approved</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label className="text-xs font-bold text-primary">Final Status</Label>
							<Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
								<SelectTrigger className="border-primary/40 bg-primary/5 font-bold text-primary">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="created">Create Enrollment</SelectItem>
									<SelectItem value="draft">Save as Draft</SelectItem>
									<SelectItem value="approveRequired">Approval Required</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</Card>

				<Card className="lg:col-span-2 p-5 space-y-4 shadow-sm border-border/60 bg-card/50">
					<div className="flex items-center gap-2 border-b pb-2">
						<Coins className="w-4 h-4 text-amber-500" />
						<h3 className="font-bold text-sm uppercase tracking-wider text-amber-600">Adjustments & Charges</h3>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
						<div className="space-y-2 sm:col-span-3">
							<Label className="text-xs font-semibold">Credit Note</Label>
							<Select
								value={formData.dnAccountId || "none"}
								onValueChange={(v) => handleChange("dnAccountId", v === "none" ? "" : v)}
								disabled={isAccountsLoading}
							>
								<SelectTrigger className="w-full h-10 bg-background border-border/60">
									<div className="flex items-center gap-2 truncate">
										{isAccountsLoading ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<Building2 className="w-4 h-4 text-muted-foreground" />
										)}
										<SelectValue placeholder={isAccountsLoading ? "Fetching accounts..." : "Select Expense Account"} />
									</div>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none" className="text-muted-foreground italic font-medium">
										-- Not Defined --
									</SelectItem>

									{dnAccounts.map((acc) => (
										<SelectItem key={acc.accountId} value={String(acc.accountId)}>
											{acc.accountName}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2 sm:col-span-1">
							<Label className="text-xs font-semibold">Amount (₹)</Label>
							<Input
								type="number"
								className="font-mono h-10 bg-background border-border/60"
								value={formData.dnOrDiscount}
								onChange={(e) => handleChange("dnOrDiscount", Number(e.target.value))}
							/>
						</div>

						<div className="space-y-2 sm:col-span-1">
							<Label className="text-xs font-semibold whitespace-nowrap">Proc. Charge (₹)</Label>
							<Input
								type="number"
								className="font-mono h-10 bg-background border-border/60"
								value={formData.processingCharge}
								onChange={(e) => handleChange("processingCharge", Number(e.target.value))}
							/>
						</div>
					</div>
				</Card>

				<Card className="lg:col-span-2 p-5 space-y-4 shadow-sm border-border/60 bg-card/50">
					<div className="flex items-center gap-2 border-b pb-2 text-emerald-500">
						<MessageSquareQuote className="w-4 h-4" />
						<h3 className="font-bold text-sm uppercase tracking-wider">Internal & External Remarks</h3>
					</div>
					<div className="grid grid-cols-1 gap-6">
						<div className="space-y-2">
							<Label className="text-sm font-semibold flex items-center gap-1">
								Print Remarks <span className="text-[10px] text-muted-foreground font-normal">(Visible on Invoice)</span>
							</Label>
							<Textarea
								className="resize-none h-24 bg-background border-muted-foreground/20"
								placeholder="Notes to be displayed on the generated bill..."
								value={formData.printRemarks}
								onChange={(e) => handleChange("printRemarks", e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-semibold flex items-center gap-1">
								Office Remarks <span className="text-[10px] text-muted-foreground font-normal">(Internal Only)</span>
							</Label>
							<Textarea
								className="resize-none h-24 bg-background border-muted-foreground/20"
								placeholder="Confidential internal notes for office use..."
								value={formData.officeRemarks}
								onChange={(e) => handleChange("officeRemarks", e.target.value)}
							/>
						</div>
					</div>
				</Card>
			</div>
		</motion.div>
	)
}