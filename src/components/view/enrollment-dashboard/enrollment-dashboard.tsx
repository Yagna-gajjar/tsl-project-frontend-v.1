import type React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";

import TopSection from "./top-section";
import BottomSection from "./bottom-section";
import { Button } from "@/components/ui/button";

export default function EnrollmentDashboard() {
  const [middleview, setMiddleview] = useState<any>(null);
  const [topHeight, setTopHeight] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
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
    if (newHeight > 20 && newHeight < 85) setTopHeight(newHeight);
  };

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
      <motion.div
        className="flex overflow-hidden border-b border-border/40"
        style={{ height: topSectionTargetHeight }}
        animate={{ height: topSectionTargetHeight }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <TopSection />
      </motion.div>

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

        <div className="absolute w-full h-[1px] bg-border group-hover:bg-primary/40 transition-colors top-1/2 -translate-y-1/2 -z-10" />
        <div className="absolute bg-background px-2 top-1/2 -translate-y-1/2 md:block hidden">
          <GripVertical className="h-4 w-4 text-muted-foreground/40" />
        </div>
      </div>

      <motion.div
        className="z-40 overflow-hidden bg-muted/5"
        style={{ height: bottomSectionTargetHeight }}
        animate={{ height: bottomSectionTargetHeight }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <BottomSection
          selectedMemberId={null}
          historyData={middleview}
        />
      </motion.div>
    </motion.div>
  );
}