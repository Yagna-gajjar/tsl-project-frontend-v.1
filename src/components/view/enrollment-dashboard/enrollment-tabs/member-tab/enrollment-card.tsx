import {
  Briefcase,
  CalendarDays,
  Clock,
  Info,
  Layers,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Enrollment } from "@/types/enrollment"
import { EnrollmentActionModal } from "../../enrollment-action-modal"

export function MiniInfo({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="space-y-0.5 overflow-hidden">
      <p className="text-[8px] text-slate-400 uppercase font-black flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="text-[10px] font-bold text-slate-700 truncate leading-tight">{value}</p>
    </div>
  )
}

export function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-7 w-7 rounded bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[8px] text-slate-400 uppercase font-black leading-none mb-0.5">{label}</p>
        <p className="text-[11px] font-bold text-slate-700 truncate">{value}</p>
      </div>
    </div>
  )
}

// ─── EnrollmentCard ───────────────────────────────────────────────────────────

interface EnrollmentCardProps {
  enrollment: Enrollment
  loadDateToVariables: (id: number) => void
  onDelete: (id: number) => void
  isActionModalOpen: boolean
  setIsActionModalOpen: (open: boolean) => void
}

export function EnrollmentCard({
  enrollment,
  loadDateToVariables,
  onDelete,
  isActionModalOpen,
  setIsActionModalOpen,
}: EnrollmentCardProps) {
  const getDaysFromPattern = (pattern: string | null) => {
    if (!pattern) return "N/A"
    const daysMap: Record<string, string> = {
      "1": "Mon", "2": "Tue", "3": "Wed",
      "4": "Thu", "5": "Fri", "6": "Sat", "7": "Sun",
    }
    return pattern.split("").map((d) => daysMap[d]).join(", ")
  }

  const renderActionButton = () => {
    const status = enrollment.status?.toLowerCase()

    if (status === "draft") {
      return (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(enrollment.enrollmentId)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            className="h-7 px-4 bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase shadow-sm"
            onClick={() => loadDateToVariables(enrollment.enrollmentId)}
          >
            Load Enr
          </Button>
        </div>
      )
    }

    if (status === "approvalpending") {
      return (
        <Button
          size="sm"
          className="h-7 px-4 bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase shadow-sm"
          onClick={() => loadDateToVariables(enrollment.enrollmentId)}
        >
          Load Enr
        </Button>
      )
    }

    if (status === "created" || status === "create") {
      return (
        <>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-4 border-blue-200 text-blue-700 hover:bg-blue-50 text-[10px] font-black uppercase"
            onClick={() => setIsActionModalOpen(true)}
          >
            Change
          </Button>
          <EnrollmentActionModal
            isOpen={isActionModalOpen}
            onClose={() => setIsActionModalOpen(false)}
            enrollment={enrollment}
          />
        </>
      )
    }

    return null
  }

  return (
    <Card className="border border-slate-100 bg-white hover:border-blue-200 hover:shadow-md transition-all">
      <div className="p-3">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-black text-xs text-slate-900 truncate uppercase tracking-tight">
                {enrollment.courseName}
              </h4>
              <Badge className="bg-emerald-50 text-emerald-700 border-none text-[8px] h-4 font-bold">
                {enrollment.membershipType}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-blue-600 text-[9px] font-bold">
              <Briefcase className="w-3 h-3" />
              {enrollment.academyEntityName}
            </div>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <span className="text-[8px] font-black text-slate-400 uppercase">Enrollment No</span>
            <span className="text-[11px] font-mono font-black text-slate-800 tracking-tighter">
              #{enrollment.enrollmentNo}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50 p-2 rounded-lg border border-slate-50 mb-2">
          <MiniInfo
            label="Duration"
            value={new Date(enrollment.attendingStartDate as string).toLocaleDateString()}
            icon={<CalendarDays className="w-2.5 h-2.5 text-blue-500" />}
          />
          <MiniInfo
            label="Schedule"
            value={getDaysFromPattern(enrollment.attendingPattern as string)}
            icon={<Clock className="w-2.5 h-2.5 text-blue-500" />}
          />
          <MiniInfo
            label="Units"
            value={`${enrollment.billingDaysSessions} Sessions`}
            icon={<Layers className="w-2.5 h-2.5 text-blue-500" />}
          />
          <div className="space-y-0.5">
            <p className="text-[8px] text-slate-400 uppercase font-black">Total Paid</p>
            <p className="text-[11px] font-black text-emerald-600">
              ₹{Number(enrollment.totalDebitAmount).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${enrollment.status === "created" ? "bg-emerald-500" : "bg-blue-400"
                  }`}
              />
              <span className="text-[9px] font-black uppercase text-slate-600">
                {enrollment.status}
              </span>
            </div>
            {enrollment.printRemarks && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-slate-300 cursor-help hover:text-blue-500 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-slate-900 text-white border-none p-2 max-w-xs shadow-xl"
                  >
                    <p className="text-[10px] leading-relaxed">{enrollment.printRemarks}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {renderActionButton()}
        </div>
      </div>
    </Card>
  )
}