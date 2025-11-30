"use client"

import { motion } from "framer-motion"
import { History, Calendar, AlertCircle } from "lucide-react"
import type { Member } from "@/types/member"

interface BottomSectionProps {
  selectedMemberId: number | null
  memberDetails: Member | null
}

export default function BottomSection({ selectedMemberId, memberDetails }: BottomSectionProps) {
  const memberDisplay = (m: Member) => {
    const first = (m as any).memberFirstName ?? (m as any).firstName ?? ""
    const last = (m as any).memberLastName ?? (m as any).lastName ?? ""
    return `${first} ${last}`.trim() || `#${(m as any).memberId ?? (m as any).id ?? "Unknown"}`
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="w-full bg-gradient-to-r from-background to-primary/5 p-6 overflow-auto"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.1 }} className="p-2.5 rounded-lg bg-primary/10">
            <History className="h-5 w-5 text-primary" />
          </motion.div>
          <h2 className="text-lg font-semibold text-foreground">Member History & Billing</h2>
        </div>

        {selectedMemberId ? (
          <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants} className="text-sm text-muted-foreground">
              Activity history and billing for{" "}
              <span className="font-semibold text-foreground">
                {memberDetails ? memberDisplay(memberDetails) : `#${selectedMemberId}`}
              </span>
            </motion.div>

            {(memberDetails as any)?.history ? (
              <motion.div className="space-y-2" variants={containerVariants} initial="hidden" animate="visible">
                {((memberDetails as any).history as any[]).map((h, i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    whileHover={{ x: 4 }}
                    className="p-4 bg-card rounded-lg border border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="p-2 rounded-lg bg-primary/10 flex-shrink-0 mt-0.5"
                      >
                        <Calendar className="h-4 w-4 text-primary" />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground">{h.title ?? h.action ?? "Activity"}</div>
                        <div className="text-xs text-muted-foreground mt-1">{h.date ?? h.time ?? "No date"}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 gap-3"
              >
                <motion.div className="p-3 rounded-full bg-secondary/10">
                  <AlertCircle className="h-8 w-8 text-secondary-foreground/50" />
                </motion.div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">No history available</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Billing section will be implemented later</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-12"
          >
            <p className="text-sm text-muted-foreground">Select a member to view history and billing</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
