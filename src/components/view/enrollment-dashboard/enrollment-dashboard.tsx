import type React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import type { Member } from "@/types/member";
import TopSection from "./top-section";
import BottomSection from "./bottom-section";
import { Button } from "@/components/ui/button";

export default function EnrollmentDashboard() {
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const [memberDetails, setMemberDetails] = useState<Member | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [middleview, setMiddleview] = useState<any>();

  const [topHeight, setTopHeight] = useState(100);
  const [isExpanded, setIsExpanded] = useState(false);

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

    if (newHeight > 30 && newHeight < 80) {
      setTopHeight(newHeight);
    }
  };

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  useEffect(() => {
    const fetchMember = async () => {
      try {
        if (!selectedMemberId) {
          setMiddleview(null);
          return;
        }
        const res = await fetch(
          `http://localhost:9705/api/enrollment/${selectedMemberId}/middleview`,
          { method: "GET" }
        );
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setMiddleview(data.data);
      } catch (err) {
        console.error("Got error fetching middleview:", err);
        setMiddleview(null);
      }
    };
    fetchMember();
  }, [selectedMemberId]);

  const topSectionTargetHeight = isExpanded ? "0%" : `${topHeight}%`;
  const bottomSectionTargetHeight = isExpanded ? "100%" : `${100 - topHeight}%`;

  const ExpandCollapseIcon = isExpanded ? ChevronDown : ChevronUp;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="h-[87vh] flex flex-col overflow-hidden bg-background"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <motion.div
        className="flex overflow-hidden"
        style={{ height: topSectionTargetHeight }}
        animate={{ height: topSectionTargetHeight }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <TopSection
          selectedFamilyId={selectedFamilyId}
          selectedMemberId={selectedMemberId}
          selectedBatch={selectedBatch}
          memberDetails={memberDetails}
          onFamilySelect={setSelectedFamilyId}
          onMemberSelect={setSelectedMemberId}
          onBatchSelect={setSelectedBatch as any}
          onMemberDetailsChange={setMemberDetails}
        />
      </motion.div>

      <div
        className="relative w-full h-10 flex justify-center items-center cursor-ns-resize z-30 "
        onMouseDown={handleMouseDown}
      >
        <Button
          onClick={toggleExpand}
          className="py-1 h-8 px-4 rounded-full z-20 flex items-center gap-2"
          variant="default"
          title={isExpanded ? "Collapse View" : "View Full History/Details"}
        >
          <span className="text-sm font-semibold">
            {!isExpanded ? "View" : "hide"} History
          </span>
          <ExpandCollapseIcon className="h-4 w-4 transition-transform duration-300" />
        </Button>

        <div className="absolute w-full h-1 bg-border/50 transition-colors duration-200 hover:bg-border top-1/2 -translate-y-1/2 -z-10 md:block hidden" />
        <GripVertical className="absolute h-4 w-4 text-muted-foreground/70 -z-10 md:block hidden" />
      </div>

      <motion.div
        className="z-40 overflow-hidden"
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
