import {
	Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
	BookOpen, Snowflake, Flame, CalendarDays, Stethoscope, Coffee, RefreshCw
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { Enrollment } from "@/types/enrollment"

const ACTIONS = [
	{ id: "change_course", label: "Change Course", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
	{ id: "freeze", label: "Freeze", icon: Snowflake, color: "text-cyan-600", bg: "bg-cyan-50" },
	{ id: "defreeze", label: "Defreeze", icon: Flame, color: "text-orange-600", bg: "bg-orange-50" },
	{ id: "change_date", label: "Change Starting Date", icon: CalendarDays, color: "text-purple-600", bg: "bg-purple-50" },
	{ id: "medical", label: "Medical Extension", icon: Stethoscope, color: "text-red-600", bg: "bg-red-50" },
	{ id: "break", label: "Break", icon: Coffee, color: "text-amber-600", bg: "bg-amber-50" },
]

interface ActionModalProps {
	isOpen: boolean
	onClose: () => void
	enrollment: Enrollment
}

export function EnrollmentActionModal({ isOpen, onClose, enrollment }: ActionModalProps) {
	const navigate = useNavigate()

	const handleActionClick = (actionId: string) => {
		// Navigate without putting the ID in the URL path
		// The data is passed internally via the 'state' object
		navigate(`/enrollment/change`, {
			state: {
				enrollmentId: enrollment.enrollmentId,
				actionType: actionId,
				enrollmentData: enrollment // Full data passed internally
			}
		})
		onClose()
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
						<RefreshCw className="w-5 h-5 text-blue-600" />
						Enrollment Actions
					</DialogTitle>
				</DialogHeader>

				<div className="grid grid-cols-2 gap-3 mt-4">
					{ACTIONS.map((action) => (
						<button
							key={action.id}
							onClick={() => handleActionClick(action.id)}
							className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group"
						>
							<div className={`p-3 rounded-full ${action.bg} ${action.color} mb-2 group-hover:scale-110 transition-transform`}>
								<action.icon className="w-6 h-6" />
							</div>
							<span className="text-[11px] font-bold text-slate-700 uppercase text-center">
								{action.label}
							</span>
						</button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}