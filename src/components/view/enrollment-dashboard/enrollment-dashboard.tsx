"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { GripVertical } from "lucide-react"
import type { Member } from "@/types/member"
import type { Batch } from "@/types/batch"
import TopSection from "./top-section"
import BottomSection from "./bottom-section"

export default function EnrollmentDashboard() {
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [memberDetails, setMemberDetails] = useState<Member | null>(null)
  const [topHeight, setTopHeight] = useState(65)
  const [isDragging, setIsDragging] = useState(false)
  const [middleview, setMiddleview] = useState<any>();


  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const container = e.currentTarget as HTMLDivElement
    const rect = container.getBoundingClientRect()
    const newHeight = ((e.clientY - rect.top) / rect.height) * 100

    if (newHeight > 30 && newHeight < 80) {
      setTopHeight(newHeight)
    }
  }

  useEffect(() => {
    const fetchMember = async () => {
      try {
        if (!selectedMemberId) return;
        const data = await fetch(`http://localhost:9705/api/enrollment/${selectedMemberId}/middleview`, {
          method: "GET"
        }).then((res) => res.json());

        console.log(data.data," ans");
        setMiddleview(data.data);
      }
      catch (err) {
        console.log("Got error");
      }
    }
    fetchMember();
  }, [selectedMemberId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="h-screen flex flex-col overflow-hidden bg-background"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div style={{ height: `${topHeight}%` }} className="flex overflow-hidden">
        <TopSection
          selectedFamilyId={selectedFamilyId}
          selectedMemberId={selectedMemberId}
          selectedBatch={selectedBatch}
          memberDetails={memberDetails}
          onFamilySelect={setSelectedFamilyId}
          onMemberSelect={setSelectedMemberId}
          onBatchSelect={setSelectedBatch}
          onMemberDetailsChange={setMemberDetails}
        />
      </div>

      <motion.div
        onMouseDown={handleMouseDown}
        className={`h-1.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent hover:bg-gradient-to-r hover:from-transparent hover:via-primary/50 hover:to-transparent cursor-row-resize transition-all group flex items-center justify-center ${isDragging ? "via-primary/70" : ""
          }`}
        whileHover={{ scaleY: 1.5 }}
      >
        <motion.div initial={false} animate={{ opacity: isDragging ? 1 : 0 }} className="absolute">
          <GripVertical className="h-4 w-4 text-primary" />
        </motion.div>
      </motion.div>

      <div style={{ height: `${100 - topHeight}%` }} className="flex overflow-hidden">
        <BottomSection selectedMemberId={selectedMemberId} historyData={middleview} />
      </div>
    </motion.div>
  )
}
