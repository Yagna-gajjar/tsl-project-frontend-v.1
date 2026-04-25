import { useState, useCallback, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronRight, ChevronLeft, CheckCircle2, ReceiptIndianRupee } from "lucide-react"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { MemberTab } from "./enrollment-tabs/member-tab/member-tab"
import { CourseTab } from "./enrollment-tabs/course-tab"
import { CourseRateTab } from "./enrollment-tabs/course-rate-tab"
import { BatchTab } from "./enrollment-tabs/batch-tab"
import { ConfirmTab as BillTab } from "./enrollment-tabs/confirm-tab"
import FinalConfirmTab from "./enrollment-tabs/final-confirm-tab"

import { EnrollmentDetails } from "./enrollment-details"
import type { Enrollment, Enrollment as EnrollmentData } from "@/types/enrollment"
import { toast } from "@/hooks/use-toast"
import type { Response } from "@/types/response"
import { createEnrollment, deleteEnrollment } from "@/api/enrollment.api"
import { useAuth } from "@/contexts/authContext"
import { useLocation, useNavigate } from "react-router-dom"
import { TransactionModalForEnrollment } from "./Transaction-modal-for-enrollment"
import type { Transaction } from "@/types/transaction"
import { ChangeCourseRateTab } from "./enrollment-tabs/change-course-rate-tab"
import { process1 } from "@/helpers/enrollment-change/process1"
import { getCourseById } from "@/api/course.api"

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
	const location = useLocation()

	const [currentTabIndex, setCurrentTabIndex] = useState(0);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [enrollmentData, setEnrollmentData] = useState<EnrollmentData>();
	const [completedTabs, setCompletedTabs] = useState<Set<TabValue>>(new Set());
	const [changeVersions, setChangeVersions] = useState<{} | any>();
	const navigate = useNavigate();
	const [showTransModal, setShowTransModal] = useState(false);
	const currentTabValue = TAB_ORDER[currentTabIndex] as TabValue;
	const [transactionData, setTransactionData] = useState<Transaction>();

	const emptyReceipt = useMemo(() => ({
		transactionType: "receipt",
		typeSerialNo: 0,
		crEntityId: enrollmentData?.course?.entityId || null,
		crAccountId: enrollmentData?.accountId || null,
		crMemberId: enrollmentData?.member?.memberId || null,
		crMsNo: enrollmentData?.membershipMasterId || null,
		drEntityId: 1,
		drAccountId: null,
		drMemberId: null,
		drMsNo: null,
		transactionDetails: `Enrollment for ${enrollmentData?.course?.courseName || ''}`,
		entrySource: "Admin Office",
		enrollmentId: enrollmentData?.enrollmentId || null,
		formReferenceNo: "",
		amount: enrollmentData?.totalDebitAmount || 0,
		accApproval: false,
		auditRemarks: "",
		printRemarks: "",
		adminRemarks: "",
		status: "active",
	}), [enrollmentData]);

	const [balance, setbalance] = useState<number>(0);

	const getProcessData = async (enrollment: Enrollment) => {
		if (enrollment) {
			const res = await process1(enrollment, new Date(), 100, false);
			setChangeVersions(res);
			setbalance(res.values.value4 || {});
		}
	}
	useEffect(() => {
		if (location.state) {
			if (location.state.tabIndex) {
				setCurrentTabIndex(location.state.tabIndex)
			}
			if (location.state) {
				if (location.state.type == "CHANGE_COURSE" && location.state.enrollment) {
					getProcessData({ ...location.state.enrollment })
				}
			}
		}
	}, [location.state])
	const canProceedToNext = useMemo(() => {
		if (completedTabs.has(currentTabValue)) return true;

		switch (currentTabValue) {
			case "member": return !!enrollmentData?.member;
			case "course": return !!enrollmentData?.course;
			case "courseRate": return !!enrollmentData?.courseRate;
			case "batch": return !!enrollmentData?.batch || enrollmentData?.course?.chargingPattern?.toLowerCase() == 'session';
			case "bill": return !!enrollmentData?.status;
			default: return false;
		}
	}, [currentTabValue, completedTabs, enrollmentData]);


	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const activeElement = document.activeElement as HTMLElement;
			const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement?.tagName) || activeElement?.isContentEditable;

			if (isInputActive) return;

			if (e.key === "ArrowRight") {
				if (canProceedToNext) {
					handleNext();
				}
			} else if (e.key === "ArrowLeft") {
				if (currentTabIndex > 0) {
					handleBack();
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [currentTabIndex, canProceedToNext, enrollmentData, changeVersions, location.state]);

	const updateEnrollmentData = useCallback((data: Partial<EnrollmentData>, tabKey?: TabValue) => {
		setEnrollmentData((prev: any) => ({
			...prev,
			...data,
		}))

		if (tabKey) {
			setCompletedTabs((prev) => new Set([...prev, tabKey]))
		}

		if (data.enrollmentId) {
			setCurrentTabIndex(2);
		}
	}, [])

	const handleTabChange = (newTabValue: string) => {
		const newIndex = TAB_ORDER.indexOf(newTabValue as TabValue)
		if (newIndex <= currentTabIndex) {
			setCurrentTabIndex(newIndex)
		}
	}

	const handleNext = async () => {
		if (currentTabIndex < TAB_ORDER.length - 1) {
			if (currentTabIndex == 4 && location.state) {
				const courseRes = await getCourseById(Number(enrollmentData?.courseId));
				if (courseRes.success) {
					navigate("/enrollment/change",
						{
							state: {
								enrollmentId: location.state.enrollment.enrollmentId,
								activity: courseRes.data,
								actionType: "CHANGE_COURSE",
								enrollmentData: location.state.enrollment,
								passedValues: changeVersions.values,
								passedModification: changeVersions?.modify,
								passedNewVersion: changeVersions?.newVersion,
								passedNewEnrollment: enrollmentData,
							}
						}
					)
				}
			} else {
				setCurrentTabIndex(currentTabIndex + 1)
			}
		}
	}

	const handleBack = () => {
		if (currentTabIndex > 0) {
			setCurrentTabIndex(currentTabIndex - 1)
		}
	}

	function calculateEndTime(startTime: string, sessionMinutes: number): string {
		if (!startTime || !sessionMinutes) return startTime;

		const [h, m, s = "0"] = startTime.split(":");
		const date = new Date();

		date.setHours(Number(h));
		date.setMinutes(Number(m));
		date.setSeconds(Number(s));
		date.setMinutes(date.getMinutes() + Number(sessionMinutes));
		return date.toTimeString().slice(0, 8);
	}

	const handleCreateEnrollment = async () => {
		const enrollmentPayload = {
			firstEnrollmentId: enrollmentData?.firstEnrollmentId ?? null,
			enrollmentNo: enrollmentData?.enrollmentNo ?? null,
			membershipMasterId: enrollmentData?.membershipMasterId ?? null,
			membershipId: enrollmentData?.membershipId ?? null,
			accountId: enrollmentData?.accountId ?? null,
			memberId: enrollmentData?.member?.memberId ?? null,
			activityId: enrollmentData?.activityId ?? null,
			courseId: enrollmentData?.courseId ?? null,
			courseRateId: enrollmentData?.courseRate?.courseRateId,
			dnAccountId: enrollmentData?.dnAccountId ?? null,
			academyEntityId: enrollmentData?.academyEntityId ?? null,

			enrollmentDate: enrollmentData?.enrollmentDate ?? new Date(),
			attendingStartDate: enrollmentData?.attendingStartDate ?? null,
			endDate: enrollmentData?.endDate ?? null,
			attendingPattern: enrollmentData?.attendingPattern ?? null,
			attendingPatternDays: enrollmentData?.attendingPatternDays ?? null,
			billingDaysSessions: enrollmentData?.billingDaysSessions ?? 0,
			permittedDays: enrollmentData?.permittedDays ?? 0,
			membersEnrolled: enrollmentData?.membersEnrolled ?? 1,

			patternDiscount: enrollmentData?.patternDiscount ?? 0,
			rackPrice: enrollmentData?.courseRate?.unitRate ?? 0,
			dnOrDiscount: enrollmentData?.dnOrDiscount ?? 0,
			billingRate: enrollmentData?.billingRate ?? 0,
			costToMember: enrollmentData?.costToMember ?? 0,
			roundedAmount: enrollmentData?.roundedAmount ?? 0,
			billingAmount: enrollmentData?.billingAmount ?? 0,
			cgstAmount: enrollmentData?.cgstAmount ?? 0,
			sgstAmount: enrollmentData?.sgstAmount ?? 0,
			totalDebitAmount: enrollmentData?.totalDebitAmount ?? 0,
			processingCharge: enrollmentData?.processingCharge ?? 0,

			openEnrollment: enrollmentData?.openEnrollment ?? false,
			status: enrollmentData?.status ?? "active",
			changeNo: enrollmentData?.changeNo ?? 0,
			previousCourseID: enrollmentData?.previousCourseID ?? null,

			printRemarks: enrollmentData?.printRemarks ?? null,
			officeRemarks: enrollmentData?.officeRemarks ?? null,
			walkingName: enrollmentData?.walkingName ?? null,
			walkingContact: enrollmentData?.walkingContact ?? null,

			memberApprovalStatus: enrollmentData?.memberApprovalStatus ?? null,
			academyApprovalStatus: enrollmentData?.academyApprovalStatus ?? null,
			finalTSLApproval: enrollmentData?.finalTSLApproval ?? null,

			createdBy: user?.memberId ?? null,
			batchId: enrollmentData?.batch?.batchId,
			startTime: enrollmentData?.startTime,
			endTime: enrollmentData?.startTime && enrollmentData?.course?.sessionMinutes
				? calculateEndTime(
					enrollmentData.startTime,
					enrollmentData.course.sessionMinutes
				)
				: null,
			chargingPattern: enrollmentData?.course?.chargingPattern,
			transaction: transactionData ?? null
		}
		if (enrollmentData?.isDraft) {
			try {
				const dRes: Response<EnrollmentData> = await deleteEnrollment(enrollmentData.enrollmentId);
				if (!dRes.success) {
					throw new Error("failed to delete");
				}
			}
			catch {
				toast({
					title: "Error",
					description: "Failed to delete Enrollment",
					variant: "destructive"
				});
				return;
			}
		}
		try {
			const eRes: Response<any> = await createEnrollment(enrollmentPayload as any);
			if (eRes.success) {
				toast({
					title: "Success",
					description: "Enrollment craeted successfully.",
					variant: "success"
				});
				handleClear()
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
	}

	const handleClear = () => {
		navigate(location.pathname, { replace: true, state: null });
		setEnrollmentData({});
		setCompletedTabs(new Set());
		setCurrentTabIndex(0);
		setChangeVersions(undefined);
		setbalance(0);
		setTransactionData(undefined);
	}

	return (
		<div className="flex min-h-screen flex-col lg:flex-row gap-4 md:gap-6 p-4 md:p-8 bg-background">
			<div className="flex-1 min-w-0">
				<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
					<div className="mb-8">
						<div className="flex justify-between items-center">
							<h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">Sports Academy Enrollment</h1>
							<Button
								onClick={handleClear}
								className="bg-primary/10 text-primary border border-primary hover:bg-primary/20"
							>
								Clear
							</Button>
						</div>
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
											// onUpdate={(data) => updateEnrollmentData({ member: data }, "member")}
											onUpdate={(data) => updateEnrollmentData(data, "member")}
										/>
									</TabsContent>

									<TabsContent value="course" className="mt-0 h-full">
										{location.state ?
											<CourseTab
												data={enrollmentData}
												onUpdate={(data) => updateEnrollmentData(data, "course")}
												member={location.state.memberId}
											/>
											: <CourseTab
												data={enrollmentData}
												onUpdate={(data) => updateEnrollmentData(data, "course")}
												member={enrollmentData?.member}
											/>}
									</TabsContent>

									<TabsContent value="courseRate" className="mt-0 h-full">
										{balance != 0 ? <ChangeCourseRateTab
											balance={balance}
											onUpdate={(data) => updateEnrollmentData(data, "courseRate")}
											data={enrollmentData}
										/> :
											<CourseRateTab
												data={enrollmentData}
												onUpdate={(data) => updateEnrollmentData(data, "courseRate")}
											/>}
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
								<>
									<Button
										onClick={() => setShowTransModal(true)}
										className="min-w-[180px] bg-amber-500 hover:bg-amber-600 text-white shadow-lg px-6 flex items-center gap-2"
									>
										<ReceiptIndianRupee className="w-5 h-5" />
										Transaction Details
									</Button>
									<Button
										onClick={() => {
											setShowConfirmDialog(true)
										}}
										disabled={!canProceedToNext}
										className="min-w-[200px] bg-green-600 hover:bg-green-700 text-white shadow-lg px-8"
									>
										<CheckCircle2 className="	w-4 h-4 mr-2" />
										Finalize Registration
									</Button>
								</>
							)}
						</div>
						{showTransModal && (
							<TransactionModalForEnrollment
								isOpen={showTransModal}
								onClose={() => setShowTransModal(false)}
								initialData={emptyReceipt}
								setPaymentData={setTransactionData}
							/>
						)}
						<AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Confirm Enrollment?</AlertDialogTitle>
									<AlertDialogDescription>
										Are you sure you want to finalize this registration? Please verify that the course, batch, and billing details are correct.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Review Again</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => {
											handleCreateEnrollment();
											setShowConfirmDialog(false);
										}}
										className="bg-green-600 hover:bg-green-700 text-white"
									>
										Yes, Finalize
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
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