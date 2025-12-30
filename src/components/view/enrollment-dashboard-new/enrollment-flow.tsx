"use client"

import { useState, useCallback} from "react"
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
import { ConfirmTab as BillTab } from "./enrollment-tabs/confirm-tab" // Renamed previous confirm to Bill
import FinalConfirmTab from "./enrollment-tabs/final-confirm-tab" // New 6th tab

import { EnrollmentDetails } from "./enrollment-details"
import type { Enrollment as EnrollmentData } from "@/types/enrollment"

// Updated TAB_ORDER with 6 steps
const TAB_ORDER = ["member", "course", "courseRate", "batch", "bill", "confirm"] as const
type TabValue = (typeof TAB_ORDER)[number]

const SIDEBAR_WIDTH = "lg:w-[180px] xl:w-[250px]";

const tabLabels: Record<TabValue, string> = {
	member: "Member",
	course: "Course",
	courseRate: "Rate",
	batch: "Batch",
	bill: "Bill",      // 5th Tab
	confirm: "Confirm", // 6th Tab
}

export function EnrollmentFlow() {
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
			const tabsToReset = TAB_ORDER.slice(currentTabIndex)
			setEnrollmentData((prev: any) => {
				const updated = { ...prev }
				tabsToReset.forEach((tab) => {
					if (tab === "member") delete updated.member
					else if (tab === "course") {
						delete updated.course
						delete updated.activity
					}
					else if (tab === "courseRate") delete updated.courseRate
					else if (tab === "batch") delete updated.batch
					else if (tab === "bill") delete updated.confirmation
					else if (tab === "confirm") delete updated.finalConfirmation
				})
				return updated
			})
			setCompletedTabs((prev) => {
				const updated = new Set(prev)
				tabsToReset.forEach((tab) => updated.delete(tab))
				return updated
			})
			setCurrentTabIndex(currentTabIndex - 1)
		}
	}

	const handleCreateEnrollment = () => {
		console.log("Creating enrollment with final data:", enrollmentData)
		alert("Enrollment submitted successfully!")
	}

	const canProceedToNext = completedTabs.has(currentTabValue)
	const allTabsComplete = TAB_ORDER.every((tab) => completedTabs.has(tab))

	return (
		<div className="flex min-h-screen flex-col lg:flex-row gap-4 md:gap-6 p-4 md:p-8 bg-background">
			<div className="flex-1 min-w-0">
				<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
					<div className="mb-8">
						<h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">Sports Academy Enrollment</h1>
						<p className="text-muted-foreground text-sm font-medium">Complete your registration in {TAB_ORDER.length} steps</p>
					</div>

					<Tabs value={currentTabValue} onValueChange={handleTabChange} className="w-full">
						{/* Changed grid-cols-5 to grid-cols-6 */}
						<TabsList className="grid w-full grid-cols-6 mb-8 bg-secondary/30 gap-1 h-auto p-1 rounded-xl">
							{TAB_ORDER.map((tab, index) => (
								<TabsTrigger
									key={tab}
									value={tab}
									disabled={index > currentTabIndex}
									className="relative text-[10px] md:text-xs data-[state=inactive]:opacity-50 flex flex-col py-3 rounded-lg"
								>
									<div className="flex flex-col items-center gap-1.5 w-full">
										{completedTabs.has(tab) ? (
											<CheckCircle2 className="w-4 h-4 text-green-500" />
										) : index === currentTabIndex ? (
											<motion.div
												className="w-2 h-2 bg-primary rounded-full"
												animate={{ scale: [1, 1.4, 1] }}
												transition={{ repeat: Infinity, duration: 2 }}
											/>
										) : (
											<div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
										)}
										<span className="font-semibold uppercase tracking-tighter sm:tracking-wider">{tabLabels[tab]}</span>
									</div>
								</TabsTrigger>
							))}
						</TabsList>

						<AnimatePresence mode="wait">
							<motion.div
								key={currentTabValue}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.2 }}
							>
								<Card className="p-4 md:p-6 bg-card border border-border shadow-xl rounded-2xl min-h-[500px]">
									<TabsContent value="member" className="mt-0">
										<MemberTab
											data={enrollmentData?.member}
											onUpdate={(data) => updateEnrollmentData({ member: data }, "member")}
										/>
									</TabsContent>

									<TabsContent value="course" className="mt-0">
										<CourseTab
											data={enrollmentData}
											onUpdate={(data) => updateEnrollmentData(data, "course")}
											member={enrollmentData?.member}
										/>
									</TabsContent>

									<TabsContent value="courseRate" className="mt-0">
										<CourseRateTab
											data={enrollmentData}
											onUpdate={(data) => updateEnrollmentData(data, "courseRate")}
										/>
									</TabsContent>

									<TabsContent value="batch" className="mt-0">
										<BatchTab
											data={enrollmentData}
											onUpdate={(data) => updateEnrollmentData(data, "batch")}
										/>
									</TabsContent>

									<TabsContent value="bill" className="mt-0">
										<BillTab
											data={enrollmentData}
											onUpdate={(data) => updateEnrollmentData(data, "bill")}
										/>
									</TabsContent>

									<TabsContent value="confirm" className="mt-0">
										<FinalConfirmTab
											data={enrollmentData}
											onUpdate={(data) => updateEnrollmentData({ finalConfirmation: data }, "confirm")}
										/>
									</TabsContent>
								</Card>
							</motion.div>
						</AnimatePresence>

						{/* Navigation Buttons */}
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

							{currentTabIndex < TAB_ORDER.length - 1 ? (
								<Button
									onClick={handleNext}
									disabled={!canProceedToNext}
									className="flex-1 sm:flex-initial min-w-[140px] flex items-center gap-2 shadow-lg"
								>
									Continue
									<ChevronRight className="w-4 h-4" />
								</Button>
							) : (
								<Button
									onClick={handleCreateEnrollment}
									disabled={!allTabsComplete}
									className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 text-white shadow-lg px-8"
								>
									<CheckCircle2 className="w-4 h-4 mr-2" />
									Create Enrollment
								</Button>
							)}
						</div>
					</Tabs>
				</motion.div>
			</div>

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