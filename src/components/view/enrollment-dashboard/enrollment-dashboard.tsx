"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";

import type { Member } from "@/types/member";
import type { Batch } from "@/types/batch";

import TopSection from "./top-section";
import BottomSection from "./bottom-section";
import { Button } from "@/components/ui/button";

export default function EnrollmentDashboard() {
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedMembershipId, setSelectedMembershipId] = useState<number | null>(null);

  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [memberDetails, setMemberDetails] = useState<Member | null>(null);
  const [middleview, setMiddleview] = useState<any>(null);

  const [topHeight, setTopHeight] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEntitySelect = (id: number | null) => {
    setSelectedEntityId(id);
    setSelectedAccountId(null);
  };

  const handleAccountSelect = (id: number | null) => {
    setSelectedAccountId(id);
    setSelectedMembershipId(null);
  };

  const handleMemberSelect = (id: number | null) => {
    setSelectedMemberId(id);
    setSelectedAccountId(null);
    setSelectedMembershipId(null);
    setMemberDetails(null);
  };

  const handleMouseDown = () => {
    if (!isExpanded) {
      setIsDragging(true);
      document.body.style.userSelect = "none";
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.userSelect = "auto";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isExpanded) return;
    const container = e.currentTarget as HTMLDivElement;
    const rect = container.getBoundingClientRect();
    const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
    if (newHeight > 20 && newHeight < 85) setTopHeight(newHeight);
  };

  useEffect(() => {
    const fetchMemberHistory = async () => {
      if (!selectedMemberId) {
        setMiddleview(null);
        return;
      }
      try {
        const res = await fetch(
          `http://localhost:9705/api/enrollment/${selectedMemberId}/middleview`
        );
        if (!res.ok) throw new Error("Failed to fetch history");
        const data = await res.json();
        setMiddleview(data.data);
      } catch (err) {
        console.error("History fetch error:", err);
        setMiddleview(null);
      }
    };
    fetchMemberHistory();
  }, [selectedMemberId]);

  const topSectionTargetHeight = isExpanded ? "0%" : `${topHeight}%`;
  const bottomSectionTargetHeight = isExpanded ? "100%" : `${100 - topHeight}%`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[87vh] flex flex-col overflow-hidden bg-background"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* TOP SECTION: Dropdowns & Configuration */}
      <motion.div
        className="flex overflow-hidden border-b border-border/40"
        style={{ height: topSectionTargetHeight }}
        animate={{ height: topSectionTargetHeight }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <TopSection
          selectedEntityId={selectedEntityId}
          selectedAccountId={selectedAccountId}
          selectedMemberId={selectedMemberId}
          selectedMembershipId={selectedMembershipId}
          selectedBatch={selectedBatch ? (selectedBatch as any).id : null}
          memberDetails={memberDetails}

          onEntitySelect={handleEntitySelect}
          onAccountSelect={handleAccountSelect}
          onMemberSelect={handleMemberSelect}
          onMembershipSelect={setSelectedMembershipId}
          onBatchSelect={setSelectedBatch}
          onMemberDetailsChange={setMemberDetails}
        />
      </motion.div>

      {/* RESIZE HANDLE / TOGGLE BAR */}
      <div
        className="relative w-full h-10 flex justify-center items-center cursor-ns-resize z-30 group"
        onMouseDown={handleMouseDown}
      >
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className="py-1 h-8 px-4 rounded-full z-20 flex items-center gap-2 shadow-lg transition-transform active:scale-95"
          variant="secondary"
        >
          <span className="text-xs font-bold tracking-tight">
            {isExpanded ? "SHOW CONTROLS" : "VIEW HISTORY"}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>

        {/* Decorative Line */}
        <div className="absolute w-full h-[1px] bg-border group-hover:bg-primary/40 transition-colors top-1/2 -translate-y-1/2 -z-10" />
        <div className="absolute bg-background px-2 top-1/2 -translate-y-1/2 md:block hidden">
          <GripVertical className="h-4 w-4 text-muted-foreground/40" />
        </div>
      </div>

      {/* BOTTOM SECTION: Historical Data / Tables */}
      <motion.div
        className="z-40 overflow-hidden bg-muted/5"
        style={{ height: bottomSectionTargetHeight }}
        animate={{ height: bottomSectionTargetHeight }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <BottomSection
          selectedMemberId={selectedMemberId}
          historyData={middleview}
        />
      </motion.div>
    </motion.div>
  );
}