import {
	Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
	BookOpen, Snowflake, Flame, CalendarDays, Stethoscope, Coffee,
	RefreshCw, LogOut, UserMinus, ShieldAlert, XCircle,
	ArrowRightLeft, Settings2, Receipt, Percent, LayoutGrid, ChevronLeft, Search
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import type { Enrollment } from "@/types/enrollment"
import { ENROLLMENT_WORKFLOW_CONFIG } from "@/helpers/enrollment-change/workflow"
import { getCourses } from "@/api/course.api"
import type { Course } from "@/types/course"

const COURSE_PICKER_ACTIONS = ["CHANGE_COURSE", "FEE_TRANSFER"]

const ACTIONS = [
	{ id: "QUIT", label: "Quit", icon: LogOut, color: "text-red-600", bg: "bg-red-50" },
	{ id: "COURSE_DISCONTINUE", label: "Discontinue", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
	{ id: "TSL_TERMINATION", label: "TSL Terminate", icon: ShieldAlert, color: "text-red-700", bg: "bg-red-100" },
	{ id: "PERMITTED_EXIT", label: "Permitted Exit", icon: UserMinus, color: "text-slate-600", bg: "bg-slate-100" },
	{ id: "FREEZER", label: "Freezer", icon: Snowflake, color: "text-cyan-600", bg: "bg-cyan-50" },
	{ id: "BREAK", label: "Break", icon: Coffee, color: "text-amber-600", bg: "bg-amber-50" },
	{ id: "SUSPEND", label: "Suspend", icon: Settings2, color: "text-zinc-600", bg: "bg-zinc-50" },
	{ id: "MEDICAL_BREAK", label: "Medical Break", icon: Stethoscope, color: "text-rose-600", bg: "bg-rose-50" },
	{ id: "DEFREEZE", label: "Defreeze", icon: Flame, color: "text-orange-600", bg: "bg-orange-50" },
	{ id: "CHANGE_COURSE", label: "Change Course", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
	{ id: "FEE_TRANSFER", label: "Fee Transfer", icon: ArrowRightLeft, color: "text-emerald-600", bg: "bg-emerald-50" },
	{ id: "CHANGE_ATTENDING_DAYS", label: "Change Days No.", icon: CalendarDays, color: "text-indigo-600", bg: "bg-indigo-50" },
	{ id: "CHANGE_START_DATE", label: "Change Start Date", icon: CalendarDays, color: "text-purple-600", bg: "bg-purple-50" },
	{ id: "CHANGE_DEBIT_NOTE", label: "Debit Note A/C", icon: Receipt, color: "text-teal-600", bg: "bg-teal-50" },
	{ id: "CHANGE_DISCOUNT", label: "Discount/Charges", icon: Percent, color: "text-pink-600", bg: "bg-pink-50" },
	{ id: "CHANGE_PATTERN_BATCH", label: "Pattern/Batch", icon: LayoutGrid, color: "text-lime-600", bg: "bg-lime-50" },
]

interface ActionModalProps {
	isOpen: boolean
	onClose: () => void
	enrollment: Enrollment
}

type ModalStep = "actions" | "course-picker"

export function EnrollmentActionModal({ isOpen, onClose, enrollment }: ActionModalProps) {
	const navigate = useNavigate()

	const [step, setStep] = useState<ModalStep>("actions")
	const [pendingAction, setPendingAction] = useState<{ id: string; label: string } | null>(null)
	const [courses, setCourses] = useState<Course[]>([])
	const [loadingCourses, setLoadingCourses] = useState(false)
	const [searchQuery, setSearchQuery] = useState("")

	const handleClose = () => {
		setStep("actions")
		setPendingAction(null)
		setCourses([])
		setSearchQuery("")
		onClose()
	}

	const navigateToChange = (actionId: string, actionLabel: string, activity: Course) => {
		const config = ENROLLMENT_WORKFLOW_CONFIG[actionId]
		console.log(actionLabel);
		navigate(`/enrollment/change`, {
			state: {
				enrollmentId: enrollment.enrollmentId,
				activity: activity ?? null,
				actionType: actionId,
				enrollmentData: enrollment,
				existingEnrollment: config.existingEnrollment,
				newVersion: config.newVersion,
				newEnrollment: config.newEnrollment,
			}
		})
		handleClose()
	}

	const handleActionClick = async (actionId: string, actionLabel: string) => {
		if (COURSE_PICKER_ACTIONS.includes(actionId)) {
			setPendingAction({ id: actionId, label: actionLabel })
			setStep("course-picker")
		} else {
			// Fetch course automatically for other actions
			try {
				setLoadingCourses(true)

				const res = await getCourses({
					activityName: actionLabel, // or whatever your backend expects
				})

				const course = res.data?.[0]

				if (!course) {
					console.error("No course found for action:", actionLabel)
					return
				}

				navigateToChange(actionId, actionLabel, course)

			} finally {
				setLoadingCourses(false)
			}
		}
	}

	useEffect(() => {
		if (step !== "course-picker") return

		const timeout = setTimeout(async () => {
			setLoadingCourses(true)
			try {
				const res = await getCourses({ search: searchQuery.trim() })
				setCourses(res.data ?? [])
			} finally {
				setLoadingCourses(false)
			}
		}, 400)

		return () => clearTimeout(timeout)
	}, [searchQuery, step])

	const handleCourseSelect = (course: Course) => {
		if (!pendingAction) return

		navigateToChange(pendingAction.id, pendingAction.label, course)
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
						{step === "course-picker" ? (
							<>
								<button
									onClick={() => setStep("actions")}
									className="p-1 rounded-lg hover:bg-slate-100 transition-colors mr-1"
								>
									<ChevronLeft className="w-5 h-5 text-slate-500" />
								</button>
								<BookOpen className="w-5 h-5 text-blue-600" />
								Select Course — {pendingAction?.label}
							</>
						) : (
							<>
								<RefreshCw className="w-5 h-5 text-blue-600" />
								Enrollment Management Actions
							</>
						)}
					</DialogTitle>
				</DialogHeader>

				{/* ── STEP 1: Action Grid ── */}
				{step === "actions" && (
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 max-h-[60vh] overflow-y-auto p-1">
						{ACTIONS.map((action) => (
							<button
								key={action.id}
								onClick={() => handleActionClick(action.id, action.label)}
								className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group bg-white"
							>
								<div className={`p-2.5 rounded-full ${action.bg} ${action.color} mb-2 group-hover:scale-110 transition-transform`}>
									<action.icon className="w-5 h-5" />
								</div>
								<span className="text-[10px] font-black text-slate-700 uppercase text-center leading-tight">
									{action.label}
								</span>
								{COURSE_PICKER_ACTIONS.includes(action.id) && (
									<span className="mt-1 text-[8px] font-semibold text-blue-400 uppercase tracking-wide">
										Pick course →
									</span>
								)}
							</button>
						))}
					</div>
				)}

				{/* ── STEP 2: Course Picker ── */}
				{step === "course-picker" && (
					<div className="mt-4 flex flex-col gap-3">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<input
								autoFocus
								type="text"
								placeholder="Search by name or code..."
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
							/>
						</div>

						<div className="max-h-[50vh] overflow-y-auto flex flex-col gap-2 p-1">
							{loadingCourses ? (
								<div className="flex items-center justify-center py-12 text-slate-400 text-sm">
									<RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading courses...
								</div>
							) : courses.length === 0 ? (
								<div className="text-center py-12 text-slate-400 text-sm">
									No courses found.
								</div>
							) : (
								courses.map((course) => (
									<button
										key={course.courseId}
										onClick={() => handleCourseSelect(course)}
										className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:shadow-sm hover:bg-blue-50 transition-all text-left group"
									>
										<div className="p-2 rounded-full bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
											<BookOpen className="w-4 h-4" />
										</div>
										<div className="flex flex-col">
											<span className="text-sm font-bold text-slate-700">{course.courseName}</span>
										</div>
									</button>
								))
							)}
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}