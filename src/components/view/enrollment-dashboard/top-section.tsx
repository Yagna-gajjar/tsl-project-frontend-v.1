"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import type { Member } from "@/types/member";
import type { Batch } from "@/types/batch";
import FamilyPanel from "./panel/family-panel";
import EnrollmentPanel from "./panel/enrollment-panel";
import BatchDetailsPanel from "./panel/batch-details-panel";

interface TopSectionProps {
  selectedFamilyId: number | null;
  selectedMemberId: number | null;
  selectedBatch: Batch | null;
  memberDetails: Member | null;
  onFamilySelect: (id: number | null) => void;
  onMemberSelect: (id: number | null) => void;
  onBatchSelect: (batch: Batch | null) => void;
  onMemberDetailsChange: (member: Member | null) => void;
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
  const [leftWidth, setLeftWidth] = useState(22);
  const [rightWidth, setRightWidth] = useState(22);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // State to check if we are on a large screen
  const [isLargeScreen, setIsLargeScreen] = useState(true);

  const middleWidth = 100 - leftWidth - rightWidth;
  const memberName =
    memberDetails?.memberFirstName && memberDetails?.memberLastName
      ? `${memberDetails.memberFirstName} ${memberDetails.memberLastName}`
      : "";

  // Effect to determine if the screen is large (for responsiveness)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateScreenSize = () => setIsLargeScreen(mediaQuery.matches);

    // Initial check
    updateScreenSize();

    // Listen for changes
    mediaQuery.addEventListener("change", updateScreenSize);

    // Cleanup listener
    return () => mediaQuery.removeEventListener("change", updateScreenSize);
  }, []);

  const handleMouseDown = (side: "left" | "right") => {
    // Only allow dragging on large screens
    if (!isLargeScreen) return;
    if (side === "left") setIsDraggingLeft(true);
    if (side === "right") setIsDraggingRight(true);
  };

  const handleMouseUp = () => {
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Only run dragging logic on large screens
    if (!isLargeScreen) return;

    const container = e.currentTarget as HTMLDivElement;
    const rect = container.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;
    const newRightWidth = ((rect.right - e.clientX) / rect.width) * 100;

    // Check if dragging state is active, and ensure it stays within bounds
    if (isDraggingLeft && newLeftWidth > 15 && newLeftWidth < 40) {
      // Ensure combined width leaves enough space for the middle panel
      if (newLeftWidth + rightWidth < 80) {
        setLeftWidth(newLeftWidth);
      }
    }

    if (isDraggingRight && newRightWidth > 15 && newRightWidth < 40) {
      // Ensure combined width leaves enough space for the middle panel
      if (leftWidth + newRightWidth < 80) {
        setRightWidth(newRightWidth);
      }
    }
  };

  // Determine the width style based on screen size
  const getPanelWidth = (baseWidth: number) => {
    return isLargeScreen ? { width: `${baseWidth}%` } : { width: "100%" };
  };

  return (
    // On small screens (default), it's a column layout. On large screens (lg:), it's a row layout.
    <div
      className="flex flex-col lg:flex-row w-full overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 1. Family Panel (Left/Top) */}
      <motion.div
        style={getPanelWidth(leftWidth)}
        // Responsive classes for border and margin/padding
        className="lg:border-r border-border/50 overflow-hidden mb-4 lg:mb-0 lg:pr-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <FamilyPanel
          selectedFamilyId={selectedFamilyId}
          selectedMemberId={selectedMemberId}
          memberName={memberName}
          onFamilySelect={onFamilySelect}
          onMemberSelect={onMemberSelect}
          onMemberDetailsChange={onMemberDetailsChange}
        />
      </motion.div>

      {/* 1a. Left Divider - Only visible on large screens */}
      {isLargeScreen && (
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
      )}

      {/* 2. Enrollment Panel (Middle) */}
      <motion.div
        // Use flex-1 on large screens to take remaining space, or 100% width on small screens
        style={isLargeScreen ? { width: `${middleWidth}%` } : { width: "100%" }}
        className="flex-1 overflow-hidden border-b lg:border-none pb-4 lg:pb-0 mb-4 lg:mb-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {memberName && (
          <EnrollmentPanel
            selectedMemberId={selectedMemberId}
            memberName={memberName}
            memberDetails={memberDetails}
            selectedBatch={selectedBatch}
            onBatchSelect={onBatchSelect}
          />
        )}
      </motion.div>

      {/* 2a. Right Divider - Only visible on large screens */}
      {isLargeScreen && (
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
      )}

      {/* 3. Batch Details Panel (Right/Bottom) */}
      <motion.div
        style={getPanelWidth(rightWidth)}
        // Responsive classes for border
        className="lg:border-l border-border/50 overflow-hidden bg-background pt-4 lg:pt-0 lg:pl-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <BatchDetailsPanel selectedBatch={selectedBatch} />
      </motion.div>
    </div>
  );
}
