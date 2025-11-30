"use client"

import { motion } from "framer-motion"
import { BookOpen, Users, Building2, Clock } from "lucide-react"
import type { Batch } from "@/types/batch"

interface BatchDetailsPanelProps {
  selectedBatch: Batch | null
}

export default function BatchDetailsPanel({ selectedBatch }: BatchDetailsPanelProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: 10 },
    visible: { opacity: 1, x: 0 },
  }

  if (!selectedBatch) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-background to-primary/5 gap-3"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          className="p-3 rounded-full bg-primary/10"
        >
          <BookOpen className="h-8 w-8 text-primary/60" />
        </motion.div>
        <p className="text-center px-4">
          <span className="block text-sm font-medium text-foreground">No batch selected</span>
          <span className="block text-xs text-muted-foreground mt-1">Select a batch to view details</span>
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="h-full overflow-y-auto bg-background p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="space-y-3">
        <motion.div variants={itemVariants} className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <motion.div whileHover={{ scale: 1.1 }} className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </motion.div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {(selectedBatch as any).batchName ?? (selectedBatch as any).name}
              </h3>
              <div className="text-xs text-muted-foreground">
                ID: {(selectedBatch as any).batchId ?? (selectedBatch as any).id}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-card rounded-lg border border-border/50 p-3 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.1 }} className="p-2 rounded-lg bg-accent/10 flex-shrink-0">
              <Users className="h-4 w-4 text-accent" />
            </motion.div>
            <div>
              <div className="text-xs text-muted-foreground">Coach</div>
              <div className="text-sm font-medium text-foreground">
                {(selectedBatch as any).coachFirstName ?? "N/A"}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-card rounded-lg border border-border/50 p-3 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.1 }} className="p-2 rounded-lg bg-secondary/10 flex-shrink-0">
              <BookOpen className="h-4 w-4 text-secondary-foreground" />
            </motion.div>
            <div>
              <div className="text-xs text-muted-foreground">Course</div>
              <div className="text-sm font-medium text-foreground">{(selectedBatch as any).courseName ?? "N/A"}</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-card rounded-lg border border-border/50 p-3 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.1 }} className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
              <Building2 className="h-4 w-4 text-blue-600" />
            </motion.div>
            <div>
              <div className="text-xs text-muted-foreground">Facility</div>
              <div className="text-sm font-medium text-foreground">{(selectedBatch as any).facilityName ?? "N/A"}</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-card rounded-lg border border-border/50 p-3 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.1 }} className="p-2 rounded-lg bg-orange-500/10 flex-shrink-0">
              <Clock className="h-4 w-4 text-orange-600" />
            </motion.div>
            <div>
              <div className="text-xs text-muted-foreground">Schedule</div>
              <div className="text-sm font-medium text-foreground">{(selectedBatch as any).schedule ?? "N/A"}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
