"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { EnrollmentData } from "@/types/enrollment"

interface ConfirmTabProps {
	data?: EnrollmentData
	onUpdate: (data: Partial<EnrollmentData>) => void
}

export function ConfirmTab({ data, onUpdate }: ConfirmTabProps) {
	const [formData, setFormData] = useState({
		walkingName: "",
		walkingContact: "",
		officeRemarks: "",
		printRemarks: "",
		memberEnrolled: false,
		agreedTerms: false,
	})

	useEffect(() => {
		if (data?.confirmation) {
			setFormData(data.confirmation)
		}
	}, [data?.confirmation])

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target
		const updated = { ...formData, [name]: value }
		setFormData(updated)
		onUpdate({ confirmation: updated })
	}

	const handleCheckboxChange = (checked: boolean, field: "memberEnrolled" | "agreedTerms") => {
		const updated = { ...formData, [field]: checked }
		setFormData(updated)
		onUpdate({ confirmation: updated })
	}

	const isValid = formData.agreedTerms && formData.walkingName.trim() && formData.walkingContact.trim()

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
			<div className="space-y-6">
				<div>
					<h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
						<CheckCircle2 className="w-6 h-6" />
						Confirm Enrollment
					</h2>
					<p className="text-muted-foreground">Review and complete your enrollment</p>
				</div>

				<div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border">
					<h3 className="font-semibold text-sm">Walking Information</h3>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="walking-name" className="text-sm font-medium">
								Walking Name *
							</Label>
							<Input
								id="walking-name"
								name="walkingName"
								placeholder="Enter name for walking"
								value={formData.walkingName}
								onChange={handleInputChange}
								className="bg-background border-border"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="walking-contact" className="text-sm font-medium">
								Walking Contact *
							</Label>
							<Input
								id="walking-contact"
								name="walkingContact"
								placeholder="Enter contact number"
								value={formData.walkingContact}
								onChange={handleInputChange}
								className="bg-background border-border"
							/>
						</div>
					</div>
				</div>

				<div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border">
					<h3 className="font-semibold text-sm">Remarks & Notes</h3>

					<div className="space-y-2">
						<Label htmlFor="office-remarks" className="text-sm font-medium">
							Office Remarks
						</Label>
						<Textarea
							id="office-remarks"
							name="officeRemarks"
							placeholder="Internal office notes..."
							value={formData.officeRemarks}
							onChange={handleInputChange}
							className="bg-background border-border resize-none"
							rows={3}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="print-remarks" className="text-sm font-medium">
							Print Remarks
						</Label>
						<Textarea
							id="print-remarks"
							name="printRemarks"
							placeholder="Remarks to be printed on documents..."
							value={formData.printRemarks}
							onChange={handleInputChange}
							className="bg-background border-border resize-none"
							rows={3}
						/>
					</div>
				</div>

				{/* Enrollment Status */}
				<Card className="p-4 bg-card border border-border">
					<div className="space-y-3">
						<div className="flex items-start gap-3">
							<Checkbox
								id="member-enrolled"
								checked={formData.memberEnrolled}
								onCheckedChange={(checked) => handleCheckboxChange(checked as boolean, "memberEnrolled")}
								className="mt-1"
							/>
							<Label htmlFor="member-enrolled" className="flex-1 text-sm cursor-pointer">
								<span className="font-medium">Member Enrollment Confirmed</span>
								<p className="text-xs text-muted-foreground mt-1">
									Confirm that the member details and selections are correct and ready for enrollment.
								</p>
							</Label>
						</div>
					</div>
				</Card>

				{/* Terms & Conditions */}
				<Card className="p-4 bg-card border border-border">
					<div className="space-y-4">
						<div className="flex items-start gap-3">
							<Checkbox
								id="terms"
								checked={formData.agreedTerms}
								onCheckedChange={(checked) => handleCheckboxChange(checked as boolean, "agreedTerms")}
								className="mt-1"
							/>
							<Label htmlFor="terms" className="flex-1 text-sm cursor-pointer">
								<span className="font-medium">I agree to the Terms & Conditions *</span>
								<p className="text-xs text-muted-foreground mt-1">
									By enrolling, you agree to our terms of service, cancellation policy, and code of conduct at the
									academy.
								</p>
							</Label>
						</div>

						{!formData.agreedTerms && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="flex gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md"
							>
								<AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
								<p className="text-xs text-yellow-700 dark:text-yellow-500">
									You must accept the terms and conditions to complete enrollment.
								</p>
							</motion.div>
						)}
					</div>
				</Card>

				{/* Summary Card */}
				{formData.agreedTerms && formData.memberEnrolled && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
					>
						<div className="flex gap-3">
							<CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0" />
							<div>
								<p className="font-medium text-sm text-green-900 dark:text-green-100">Ready to create enrollment!</p>
								<p className="text-xs text-green-700 dark:text-green-300 mt-1">
									All information is complete. Click "Create Enrollment" to finalize.
								</p>
							</div>
						</div>
					</motion.div>
				)}

				<motion.div whileHover={{ scale: isValid ? 1.02 : 1 }} whileTap={{ scale: isValid ? 0.98 : 1 }}>
					<Button disabled={!isValid} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
						Ready to Submit
					</Button>
				</motion.div>
			</div>
		</motion.div>
	)
}
