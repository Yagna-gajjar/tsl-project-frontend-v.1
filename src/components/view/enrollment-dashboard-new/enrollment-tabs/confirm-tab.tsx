	"use client"

	import { useEffect, useState } from "react"
	import { motion } from "framer-motion"
	import {
		UserPlus,
		ShieldCheck,
		Settings2,
		Coins,
		MessageSquareQuote,
		ChevronRight,
		Loader2,
		Building2
	} from "lucide-react"

	// UI Components
	import { Button } from "@/components/ui/button"
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
	import { cn } from "@/lib/utils"
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
			academyApprovalStatus: data?.academyApprovalStatus || "not_required",
			status: data?.status || "create",
		});

		const [dnAccounts, setDnAccounts] = useState<Account[]>([]);
		const [isAccountsLoading, setIsAccountsLoading] = useState(false);

		// Handle standard input changes
		const handleChange = (name: string, value: string | number) => {
			const updated = { ...formData, [name]: value }
			setFormData(updated)
			onUpdate(updated)
		}

		// Determine Button Text based on Status
		const getSubmitLabel = () => {
			switch (formData.status) {
				case "draft": return "Save as Draft"
				case "approveRequired": return "Submit for Approval"
				default: return "Create Enrollment"
			}
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
				className="space-y-6 pb-10"
			>
				<header className="flex items-center gap-3">
					<div className="p-2 bg-primary/10 rounded-lg text-primary">
						<ShieldCheck className="w-6 h-6" />
					</div>
					<div>
						<h2 className="text-2xl font-bold dark:text-slate-100">Final Confirmation</h2>
						<p className="text-sm text-muted-foreground">Review internal remarks and set enrollment status</p>
					</div>
				</header>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

					{/* SECTION 1: WALKING INFO */}
					<Card className="p-5 space-y-4 shadow-sm border-border/60 bg-card/50">
						<div className="flex items-center gap-2 border-b pb-2">
							<UserPlus className="w-4 h-4 text-primary" />
							<h3 className="font-bold text-sm uppercase tracking-wider">Walking Information</h3>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-xs">Walking Name</Label>
								<Input
									placeholder="Full Name"
									value={formData.walkingName}
									onChange={(e) => handleChange("walkingName", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs">Walking Contact</Label>
								<Input
									placeholder="Phone Number"
									value={formData.walkingContact}
									onChange={(e) => handleChange("walkingContact", e.target.value)}
								/>
							</div>
						</div>
					</Card>

					{/* SECTION 2: FINANCIAL ADJUSTMENTS */}
					<Card className="p-5 space-y-4 shadow-sm border-border/60 bg-card/50">
						<div className="flex items-center gap-2 border-b pb-2">
							<Coins className="w-4 h-4 text-amber-500" />
							<h3 className="font-bold text-sm uppercase tracking-wider">Adjustments & Charges</h3>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label className="text-xs">Credit Note</Label>
								<Select
									value={formData.dnAccountId}
									onValueChange={(v) => handleChange("dnAccountId", v)}
									disabled={isAccountsLoading}
								>
									<SelectTrigger className="w-full">
										<div className="flex items-center gap-2 truncate">
											{isAccountsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Building2 className="w-3 h-3" />}
											<SelectValue placeholder={isAccountsLoading ? "Loading..." : "Select Account"} />
										</div>
									</SelectTrigger>
									<SelectContent>
										{dnAccounts.length > 0 ? (
											dnAccounts.map((acc) => (
												<SelectItem key={acc.accountId} value={String(acc.accountId)}>
													{acc.accountName}
												</SelectItem>
											))
										) : (
											<SelectItem value="none" disabled>No accounts found</SelectItem>
										)}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label className="text-xs">Amount (₹)</Label>
								<Input
									type="number"
									value={formData.dnOrDiscount}
									onChange={(e) => handleChange("dnOrDiscount", Number(e.target.value))}
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs">Proc. Charge (₹)</Label>
								<Input
									type="number"
									value={formData.processingCharge}
									onChange={(e) => handleChange("processingCharge", Number(e.target.value))}
								/>
							</div>
						</div>
					</Card>

					{/* SECTION 3: WORKFLOW & STATUS */}
					<Card className="p-5 space-y-4 shadow-sm border-border/60 bg-card/50">
						<div className="flex items-center gap-2 border-b pb-2 text-blue-500">
							<Settings2 className="w-4 h-4" />
							<h3 className="font-bold text-sm uppercase tracking-wider">Workflow Configuration</h3>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label className="text-xs">Academy Approval</Label>
								<Select value={formData?.academyApprovalStatus as string} onValueChange={(v) => handleChange("academyApprovalStatus", v)}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>
										<SelectItem value="required">Required</SelectItem>
										<SelectItem value="not_required">Not Required</SelectItem>
										<SelectItem value="approved">Approved</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label className="text-xs font-bold text-primary">Enrollment Status</Label>
								<Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
									<SelectTrigger className="border-primary/40 bg-primary/5 font-semibold text-primary">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="create">Create Enrollment</SelectItem>
										<SelectItem value="draft">Save as Draft</SelectItem>
										<SelectItem value="approveRequired">Approval Required</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</Card>

					{/* SECTION 4: REMARKS */}
					<Card className="p-5 space-y-4 shadow-sm border-border/60 bg-card/50 lg:col-span-1">
						<div className="flex items-center gap-2 border-b pb-2 text-emerald-500">
							<MessageSquareQuote className="w-4 h-4" />
							<h3 className="font-bold text-sm uppercase tracking-wider">Remarks</h3>
						</div>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label className="text-xs">Print Remarks (On Invoice)</Label>
								<Textarea
									className="resize-none h-20 bg-background"
									placeholder="Notes for the member..."
									value={formData.printRemarks}
									onChange={(e) => handleChange("printRemarks", e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-xs">Office Remarks (Internal)</Label>
								<Textarea
									className="resize-none h-20 bg-background"
									placeholder="Internal processing notes..."
									value={formData.officeRemarks}
									onChange={(e) => handleChange("officeRemarks", e.target.value)}
								/>
							</div>
						</div>
					</Card>
				</div>

				{/* ACTION FOOTER */}
				<motion.div
					whileHover={{ scale: 1.01 }}
					whileTap={{ scale: 0.99 }}
					className="pt-4"
				>
					<Button
						className={cn(
							"w-full h-14 text-lg font-bold shadow-xl transition-all rounded-xl",
							formData.status === "draft" ? "bg-slate-700 hover:bg-slate-800" : "bg-primary hover:bg-primary/90"
						)}
					>
						{getSubmitLabel()}
						<ChevronRight className="ml-2 w-6 h-6" />
					</Button>
				</motion.div>
			</motion.div>
		)
	}