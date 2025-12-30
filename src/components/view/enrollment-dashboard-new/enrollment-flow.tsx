"use client"

import { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react"

// Tab Components
import { MemberTab } from "./enrollment-tabs/member-tab"
import { CourseTab } from "./enrollment-tabs/course-tab"
import { CourseRateTab } from "./enrollment-tabs/course-rate-tab"
import { BatchTab } from "./enrollment-tabs/batch-tab"
import { ConfirmTab as BillTab } from "./enrollment-tabs/confirm-tab"
import FinalConfirmTab from "./enrollment-tabs/final-confirm-tab"

import { EnrollmentDetails } from "./enrollment-details"
import type { Enrollment as EnrollmentData } from "@/types/enrollment"
import { toast } from "@/hooks/use-toast"
import type { Response } from "@/types/response"
import { createEnrollment } from "@/api/enrollment.api"
import { useAuth } from "@/contexts/authContext"

const TAB_ORDER = ["member", "course", "courseRate", "batch", "bill", "confirm"] as const
type TabValue = (typeof TAB_ORDER)[number]

const SIDEBAR_WIDTH = "lg:w-[180px] xl:w-[250px]";

const tabLabels: Record<TabValue, string> = {
	member: "Member",
	course: "Course",
	courseRate: "Rate",
	batch: "Batch",
	bill: "Bill",
	confirm: "Confirm",
}

export function EnrollmentFlow() {
	const { user } = useAuth();
	const [currentTabIndex, setCurrentTabIndex] = useState(0)
	const [enrollmentData, setEnrollmentData] = useState<EnrollmentData>()
	const [completedTabs, setCompletedTabs] = useState<Set<TabValue>>(new Set())

	const currentTabValue = TAB_ORDER[currentTabIndex] as TabValue

	const updateEnrollmentData = useCallback((data: Partial<EnrollmentData>, tabKey?: TabValue) => {
		setEnrollmentData((prev: any) => ({
			...prev,
			...data,
		}))
		if (tabKey) {
			setCompletedTabs((prev) => new Set([...prev, tabKey]))
		}
	}, [])

	const handleTabChange = (newTabValue: string) => {
		const newIndex = TAB_ORDER.indexOf(newTabValue as TabValue)
		// Allow clicking back to any previously visited tab
		if (newIndex <= currentTabIndex) {
			setCurrentTabIndex(newIndex)
		}
	}

	const handleNext = () => {
		if (currentTabIndex < TAB_ORDER.length - 1) {
			setCurrentTabIndex(currentTabIndex + 1)
		}
	}

	const handleBack = () => {
		if (currentTabIndex > 0) {
			setCurrentTabIndex(currentTabIndex - 1)
		}
	}

	const handleCreateEnrollment = async () => {
		const enrollmentPayload = {
			// IDs
			firstEnrollmentId: enrollmentData?.firstEnrollmentId ?? null,
			enrollmentNo: enrollmentData?.enrollmentNo ?? null,
			membershipMasterId: enrollmentData?.membershipMasterId ?? null,
			membershipId: enrollmentData?.membershipId ?? null,
			accountId: enrollmentData?.accountId ?? null,
			memberId: enrollmentData?.member?.memberId ?? null,
			activityId: enrollmentData?.activityId ?? null,
			courseId: enrollmentData?.courseId ?? null,
			courseRateId: enrollmentData?.courseRateId ?? null,
			dnAccountId: enrollmentData?.dnAccountId ?? null,
			academyEntityId: enrollmentData?.academyEntityId ?? null,

			// Dates & schedule
			enrollmentDate: enrollmentData?.enrollmentDate ?? new Date(),
			attendingStartDate: enrollmentData?.attendingStartDate ?? null,
			endDate: enrollmentData?.endDate ?? null,
			attendingPattern: enrollmentData?.attendingPattern ?? null,
			attendingPatternDays: enrollmentData?.attendingPatternDays ?? null,
			billingDaysSessions: enrollmentData?.billingDaysSessions ?? 0,
			permittedDays: enrollmentData?.permittedDays ?? 0,
			membersEnrolled: enrollmentData?.membersEnrolled ?? 1,

			// Pricing & tax
			patternDiscount: enrollmentData?.patternDiscount ?? 0,
			rackPrice: enrollmentData?.rackPrice ?? 0,
			dnOrDiscount: enrollmentData?.dnOrDiscount ?? 0,
			billingRate: enrollmentData?.billingRate ?? 0,
			costToMember: enrollmentData?.costToMember ?? 0,
			roundedAmount: enrollmentData?.roundedAmount ?? 0,
			billingAmount: enrollmentData?.billingAmount ?? 0,
			cgstAmount: enrollmentData?.cgstAmount ?? 0,
			sgstAmount: enrollmentData?.sgstAmount ?? 0,
			totalDebitAmount: enrollmentData?.totalDebitAmount ?? 0,
			processingCharge: enrollmentData?.processingCharge ?? 0,

			// Flags & status
			openEnrollment: enrollmentData?.openEnrollment ?? false,
			status: enrollmentData?.status ?? "active",
			changeNo: enrollmentData?.changeNo ?? 0,
			previousCourseID: enrollmentData?.previousCourseID ?? null,

			// Remarks & walking
			printRemarks: enrollmentData?.printRemarks ?? null,
			officeRemarks: enrollmentData?.officeRemarks ?? null,
			walkingName: enrollmentData?.walkingName ?? null,
			walkingContact: enrollmentData?.walkingContact ?? null,

			// Approvals
			memberApprovalStatus: enrollmentData?.memberApprovalStatus ?? null,
			academyApprovalStatus: enrollmentData?.academyApprovalStatus ?? null,
			finalTSLApproval: enrollmentData?.finalTSLApproval ?? null,

			// Audit
			createdBy: user?.memberId ?? null,
			batchId: enrollmentData?.batch?.batchId
		}

		try {
			const eRes: Response<any> = await createEnrollment(enrollmentPayload as any);
			if (eRes.success) {
				toast({
					title: "Success",
					description: "Enrollment craeted successfully.",
					variant: "success"
				})
			}
			else {
				toast({
					title: "Error",
					description: eRes.message || "Failed to Save",
					variant: "destructive"
				})
			}
		}
		catch {
			toast({
				title: "Error",
				description: "Failed to create enrollment",
				variant: "destructive"
			})
		}

		console.log("Creating enrollment with final payload:", enrollmentPayload)
		alert("Enrollment submitted successfully!")
	}

	// Improved Validation Logic to prevent getting stuck
	const canProceedToNext = useMemo(() => {
		if (completedTabs.has(currentTabValue)) return true;

		// Fallback: Check if the necessary data for the current tab actually exists
		switch (currentTabValue) {
			case "member": return !!enrollmentData?.member;
			case "course": return !!enrollmentData?.course;
			case "courseRate": return !!enrollmentData?.courseRate;
			case "batch": return !!enrollmentData?.batch;
			case "bill": return !!enrollmentData?.status; // Check if status is set in Bill tab
			default: return false;
		}
	}, [currentTabValue, completedTabs, enrollmentData]);

	return (
		<div className="flex min-h-screen flex-col lg:flex-row gap-4 md:gap-6 p-4 md:p-8 bg-background">
			{/* Left Side - Flexible Content Area */}
			<div className="flex-1 min-w-0">
				<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
					<div className="mb-8">
						<h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">Sports Academy Enrollment</h1>
						<p className="text-muted-foreground text-sm font-medium">Step {currentTabIndex + 1} of {TAB_ORDER.length}: {tabLabels[currentTabValue]}</p>
					</div>

					<Tabs value={currentTabValue} onValueChange={handleTabChange} className="w-full">
						<TabsList className="grid w-full grid-cols-6 mb-8 bg-secondary/30 gap-1 h-auto p-1 rounded-xl">
							{TAB_ORDER.map((tab, index) => {
								const isCompleted = completedTabs.has(tab);
								const isActive = index === currentTabIndex;

								return (
									<TabsTrigger
										key={tab}
										value={tab}
										disabled={index > currentTabIndex && !isCompleted}
										className="relative text-[10px] md:text-xs flex flex-col py-3 rounded-lg transition-all"
									>
										<div className="flex flex-col items-center gap-1.5 w-full">
											{isCompleted ? (
												<CheckCircle2 className="w-4 h-4 text-green-500" />
											) : isActive ? (
												<motion.div
													className="w-2 h-2 bg-primary rounded-full"
													animate={{ scale: [1, 1.4, 1] }}
													transition={{ repeat: Infinity, duration: 2 }}
												/>
											) : (
												<div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
											)}
											<span className="font-semibold uppercase tracking-tighter">{tabLabels[tab]}</span>
										</div>
									</TabsTrigger>
								)
							})}
						</TabsList>

						<AnimatePresence mode="wait">
							<motion.div
								key={currentTabValue}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.2 }}
								className="min-h-[500px]"
							>
								<Card className="p-4 md:p-6 bg-card border border-border shadow-xl rounded-2xl h-full">
									<TabsContent value="member" className="mt-0 h-full">
										<MemberTab
											data={enrollmentData?.member}
											onUpdate={(data) => updateEnrollmentData({ member: data }, "member")}
										/>
									</TabsContent>

									<TabsContent value="course" className="mt-0 h-full">
										<CourseTab
											data={enrollmentData}
											onUpdate={(data) => updateEnrollmentData(data, "course")}
											member={enrollmentData?.member}
										/>
									</TabsContent>

									<TabsContent value="courseRate" className="mt-0 h-full">
										<CourseRateTab
											data={enrollmentData}
											onUpdate={(data) => updateEnrollmentData(data, "courseRate")}
										/>
									</TabsContent>

									<TabsContent value="batch" className="mt-0 h-full">
										<BatchTab
											data={enrollmentData}
											onUpdate={(data) => updateEnrollmentData(data, "batch")}
										/>
									</TabsContent>

									<TabsContent value="bill" className="mt-0 h-full">
										<BillTab
											data={enrollmentData}
											onUpdate={(data) => updateEnrollmentData(data, "bill")}
										/>
									</TabsContent>

									<TabsContent value="confirm" className="mt-0 h-full">
										<FinalConfirmTab
											data={enrollmentData}
											onUpdate={(data) => updateEnrollmentData(data, "confirm")}
										/>
									</TabsContent>
								</Card>
							</motion.div>
						</AnimatePresence>

						{/* Navigation Footer */}
						<div className="flex gap-3 mt-6 flex-col sm:flex-row">
							<Button
								variant="ghost"
								onClick={handleBack}
								disabled={currentTabIndex === 0}
								className="flex items-center gap-2"
							>
								<ChevronLeft className="w-4 h-4" />
								Back
							</Button>

							<div className="flex-1" />

							{currentTabIndex < TAB_ORDER.length - 1 ? (
								<Button
									onClick={handleNext}
									disabled={!canProceedToNext}
									className="min-w-[160px] flex items-center gap-2 shadow-lg group"
								>
									Continue to {tabLabels[TAB_ORDER[currentTabIndex + 1]]}
									<ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
								</Button>
							) : (
								<Button
									onClick={handleCreateEnrollment}
									disabled={!canProceedToNext}
									className="min-w-[200px] bg-green-600 hover:bg-green-700 text-white shadow-lg px-8"
								>
									<CheckCircle2 className="w-4 h-4 mr-2" />
									Finalize Registration
								</Button>
							)}
						</div>
					</Tabs>
				</motion.div>
			</div>

			{/* Right Side - Info Sidebar */}
			<div className={`w-full shrink-0 transition-all duration-300 ${SIDEBAR_WIDTH}`}>
				<motion.div
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
					className="sticky top-8"
				>
					<EnrollmentDetails data={enrollmentData as any} currentTab={currentTabValue} />
				</motion.div>
			</div>
		</div>
	)
}