"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { History, Calendar, AlertCircle, TrendingUp, ArrowRightLeft, CheckCircle2 } from "lucide-react"

// 1. Precise Interface Definition based on your JSON Data
export interface EnrollmentHistoryItem {
  enrollmentId: number
  enrollmentDate: string
  startDate: string
  endDate: string
  academyName: string
  courseName: string
  status: "active" | "changed" | string
  changeType: string | null
  source: string
  billingAmount: string
  processingCharge: string | null
  commitedAmount: number
  memberFirstName: string
  memberLastName: string
}

interface BottomSectionProps {
  selectedMemberId?: number | null
  historyData: EnrollmentHistoryItem[] | null
}

export default function BottomSection({ selectedMemberId, historyData }: BottomSectionProps) {

  useEffect(() => {
    console.log("BottomSection received historyData:", historyData)
  }, [historyData])

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getDuration = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const getRowStyles = (status: string, changeType: string | null) => {
    if (status === "changed") {
      return "ml-12 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10"
    }

    if (changeType === "course-change") {
      return "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
    }
    if (status === "active") {
      return "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-md"
    }
    return "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-90"
  }

  // Helper: Badge colors
  const getBadgeStyles = (status: string, changeType: string | null) => {
    if (status === "changed") {
      return "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700"
    }
    if (changeType === "course-change") {
      return "bg-blue-600 text-white border-blue-600"
    }
    if (status === "active") {
      return "bg-slate-900 dark:bg-slate-50 dark:text-slate-900 text-white border-slate-900 dark:border-slate-50"
    }
    return "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full  transition-colors duration-300 overflow-y-auto"
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Enrollment History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recent courses and billing details
            </p>
          </div>
        </div>

        {historyData && historyData.length > 0 ? (
          <div className="space-y-4">
            {historyData.map((item, index) => (
              <motion.div
                key={index} // Changed to index as requested
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.005 }}
                className={`group relative overflow-hidden rounded-xl border p-5 transition-all ${getRowStyles(
                  item.status,
                  item.changeType
                )}`}
              >
                {/* Left Accent Bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    item.status === "active"
                      ? "bg-slate-900 dark:bg-slate-100"
                      : item.status === "changed"
                      ? "bg-amber-400"
                      : item.changeType === "course-change"
                      ? "bg-blue-500"
                      : "bg-slate-300 dark:bg-slate-700"
                  }`}
                />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pl-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border ${getBadgeStyles(
                          item.status,
                          item.changeType
                        )}`}
                      >
                        {item.changeType
                          ? item.changeType.replace("-", " ")
                          : item.status}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        #{item.enrollmentId}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.courseName}
                    </h3>

                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <TrendingUp className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                      <span className="font-semibold">{item.academyName}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">
                        INR
                      </span>
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {parseFloat(item.commitedAmount).toLocaleString(
                          "en-IN",
                          { minimumFractionDigits: 2 }
                        )}
                      </span>
                    </div>

                    {item.processingCharge &&
                      parseFloat(item.processingCharge) > 0 && (
                        <div className="text-xs text-slate-600 dark:text-slate-300 font-medium bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm">
                          +{" "}
                          {parseFloat(item.processingCharge).toLocaleString(
                            "en-IN"
                          )}{" "}
                          processing
                        </div>
                      )}

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>
                        {formatDate(item.startDate)} -{" "}
                        {formatDate(item.endDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {item.source === "EnrollmentChange" ? (
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    <span>Source: {item.source}</span>
                  </div>

                  {/* Duration Tag */}
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                    {getDuration(item.startDate, item.endDate)} Days Duration
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 gap-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50"
          >
            <div className="p-4 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
              <AlertCircle className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                No history found
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
                {selectedMemberId
                  ? "This member hasn't enrolled in any courses yet."
                  : "Enrollment history will appear here once available."}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}