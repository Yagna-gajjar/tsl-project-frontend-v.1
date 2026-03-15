import {
	Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
	BookOpen, Snowflake, Flame, CalendarDays, Stethoscope, Coffee,
	RefreshCw, LogOut, UserMinus, ShieldAlert, XCircle,
	ArrowRightLeft, Settings2, Receipt, Percent, LayoutGrid
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import type { Enrollment } from "@/types/enrollment"
import { ENROLLMENT_WORKFLOW_CONFIG } from "@/helpers/enrollment-change/workflow"
import { getCourseById, getCourses } from "@/api/course.api"
import type { Course } from "@/types/course"
import { getEnrollmentById } from "@/api/enrollment.api"
import type { Response } from "@/types/response"

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

export function EnrollmentActionModal({ isOpen, onClose, enrollment }: ActionModalProps) {
	const navigate = useNavigate()
	const [loading, setLoading] = useState(false)

	const navigateToChange = (actionId: string, actionLabel: string, firstEnrPattern: number, firstEnrPatternDays: number, activity: Course) => {
		const config = ENROLLMENT_WORKFLOW_CONFIG[actionId]
		console.log(actionLabel);
		navigate(`/enrollment/change`, {
			state: {
				enrollmentId: enrollment.enrollmentId,
				firstEnrPattern,
				firstEnrPatternDays,
				activity: activity ?? null,
				actionType: actionId,
				enrollmentData: enrollment,
				existingEnrollment: config.existingEnrollment,
				newVersion: config.newVersion,
				newEnrollment: config.newEnrollment,
			}
		})
		onClose()
	}

	const handleActionClick = async (actionId: string, actionLabel: string) => {
		// 1. Redirect logic for Dashboard actions
		if (actionId == "CHANGE_COURSE") {
			navigate("/enrollment-dashboard", {
				state: { tabIndex: 1, type: "CHANGE_COURSE", enrollment: enrollment }
			})
			onClose()
			return
		}

		// 2. Logic for DEFREEZE
		if (actionId === "DEFREEZE") {
			const res = await getEnrollmentById(Number(enrollment?.firstEnrollmentId))
			if (res.data?.courseId) {
				const courseRes: Response<Course> = await getCourseById(res.data?.courseId);
				if (courseRes?.data) {
					navigateToChange(actionId, actionLabel, res.data.attendingPattern as any, res.data.attendingPatternDays as any, courseRes.data)
				}
			}
			return
		}

		// 3. Logic for all other actions (fetch default course)
		try {
			setLoading(true)
			const res = await getCourses({ activityName: actionLabel })
			const course = res.data?.[0]

			if (!course) {
				console.error("No course found for action:", actionLabel)
				return
			}

			navigateToChange(actionId, actionLabel, 0, 0, course)
		} finally {
			setLoading(false)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
						<RefreshCw className={`w-5 h-5 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
						Enrollment Management Actions
					</DialogTitle>
				</DialogHeader>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 max-h-[60vh] overflow-y-auto p-1">
					{ACTIONS.map((action) => (
						<button
							key={action.id}
							disabled={loading}
							onClick={() => handleActionClick(action.id, action.label)}
							className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group bg-white disabled:opacity-50"
						>
							<div className={`p-2.5 rounded-full ${action.bg} ${action.color} mb-2 group-hover:scale-110 transition-transform`}>
								<action.icon className="w-5 h-5" />
							</div>
							<span className="text-[10px] font-black text-slate-700 uppercase text-center leading-tight">
								{action.label}
							</span>
						</button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}