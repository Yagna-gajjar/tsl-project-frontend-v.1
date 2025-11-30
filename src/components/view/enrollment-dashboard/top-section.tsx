"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { GripVertical } from "lucide-react"
import type { Member } from "@/types/member"
import type { Batch } from "@/types/batch"
import FamilyPanel from "./panel/family-panel"
import EnrollmentPanel from "./panel/enrollment-panel"
import BatchDetailsPanel from "./panel/batch-details-panel"

interface TopSectionProps {
  selectedFamilyId: number | null
  selectedMemberId: number | null
  selectedBatch: Batch | null
  memberDetails: Member | null
  onFamilySelect: (id: number | null) => void
  onMemberSelect: (id: number | null) => void
  onBatchSelect: (batch: Batch | null) => void
  onMemberDetailsChange: (member: Member | null) => void
}

export default function TopSection({
  selectedFamilyId,
  selectedMemberId,
  selectedBatch,
  memberDetails,
  onFamilySelect,
  onMemberSelect,
  onBatchSelect,
  onMemberDetailsChange,
}: TopSectionProps) {
  const [leftWidth, setLeftWidth] = useState(22)
  const [rightWidth, setRightWidth] = useState(22)
  const [isDraggingLeft, setIsDraggingLeft] = useState(false)
  const [isDraggingRight, setIsDraggingRight] = useState(false)

  const middleWidth = 100 - leftWidth - rightWidth

  const handleMouseDown = (side: "left" | "right") => {
    if (side === "left") setIsDraggingLeft(true)
    if (side === "right") setIsDraggingRight(true)
  }

  const handleMouseUp = () => {
    setIsDraggingLeft(false)
    setIsDraggingRight(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const container = e.currentTarget as HTMLDivElement
    const rect = container.getBoundingClientRect()
    const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100
    const newRightWidth = ((rect.right - e.clientX) / rect.width) * 100

    if (isDraggingLeft && newLeftWidth > 15 && newLeftWidth < 40) {
      setLeftWidth(newLeftWidth)
    }

    if (isDraggingRight && newRightWidth > 15 && newRightWidth < 40) {
      setRightWidth(newRightWidth)
    }
  }

  return (
    <div
      className="flex w-full overflow-hidden bg-background"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <motion.div
        style={{ width: `${leftWidth}%` }}
        className="border-r border-border/50 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <FamilyPanel
          selectedFamilyId={selectedFamilyId}
          selectedMemberId={selectedMemberId}
          onFamilySelect={onFamilySelect}
          onMemberSelect={onMemberSelect}
          onMemberDetailsChange={onMemberDetailsChange}
        />
      </motion.div>

      <motion.div
        onMouseDown={() => handleMouseDown("left")}
        className={`w-1 bg-gradient-to-b from-transparent via-primary/20 to-transparent hover:bg-gradient-to-b hover:via-primary/40 cursor-col-resize transition-all group ${
          isDraggingLeft ? "via-primary/50" : ""
        }`}
        whileHover={{ scaleX: 1.5 }}
      >
        <motion.div
          initial={false}
          animate={{ opacity: isDraggingLeft ? 1 : 0 }}
          className="h-full flex items-center justify-center"
        >
          <GripVertical className="h-3.5 w-3.5 text-primary" />
        </motion.div>
      </motion.div>

      <motion.div
        style={{ width: `${middleWidth}%` }}
        className="flex-1 overflow-hidden bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <EnrollmentPanel
          selectedMemberId={selectedMemberId}
          memberDetails={memberDetails}
          selectedBatch={selectedBatch}
          onBatchSelect={onBatchSelect}
        />
      </motion.div>

      <motion.div
        onMouseDown={() => handleMouseDown("right")}
        className={`w-1 bg-gradient-to-b from-transparent via-primary/20 to-transparent hover:bg-gradient-to-b hover:via-primary/40 cursor-col-resize transition-all group ${
          isDraggingRight ? "via-primary/50" : ""
        }`}
        whileHover={{ scaleX: 1.5 }}
      >
        <motion.div
          initial={false}
          animate={{ opacity: isDraggingRight ? 1 : 0 }}
          className="h-full flex items-center justify-center"
        >
          <GripVertical className="h-3.5 w-3.5 text-primary" />
        </motion.div>
      </motion.div>

      <motion.div
        style={{ width: `${rightWidth}%` }}
        className="border-l border-border/50 overflow-hidden bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <BatchDetailsPanel selectedBatch={selectedBatch} />
      </motion.div>
    </div>
  )
}
