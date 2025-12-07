"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GripVertical, User2 } from "lucide-react";
import type { Member } from "@/types/member";
import type { Batch } from "@/types/batch";
import FamilyPanel from "./panel/family-panel";
import EnrollmentPanel from "./panel/enrollment-panel";
import BatchDetailsPanel from "./panel/batch-details-panel";

interface TopSectionProps {
  selectedFamilyId: number | null;
  selectedMemberId: number | null;
  selectedBatch: number | null;
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
  const [leftWidth, setLeftWidth] = useState(25);
  const [rightWidth, setRightWidth] = useState(25);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  const [isLargeScreen, setIsLargeScreen] = useState(true);

  const middleWidth = 100 - leftWidth - rightWidth;
  const memberName =
    memberDetails?.memberFirstName && memberDetails?.memberLastName
      ? `${memberDetails.memberFirstName} ${memberDetails.memberLastName}`
      : "";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateScreenSize = () => {
      setLeftWidth(27);
      setRightWidth(27);
      setIsLargeScreen(mediaQuery.matches);
    };

    updateScreenSize();

    mediaQuery.addEventListener("change", updateScreenSize);

    return () => mediaQuery.removeEventListener("change", updateScreenSize);
  }, []);

  const handleMouseDown = (side: "left" | "right") => {
    if (!isLargeScreen) return;
    if (side === "left") setIsDraggingLeft(true);
    if (side === "right") setIsDraggingRight(true);
  };

  const handleMouseUp = () => {
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isLargeScreen) return;

    const container = e.currentTarget as HTMLDivElement;
    const rect = container.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;
    const newRightWidth = ((rect.right - e.clientX) / rect.width) * 100;

    if (isDraggingLeft && newLeftWidth > 15 && newLeftWidth < 40) {
      if (newLeftWidth + rightWidth < 80) {
        setLeftWidth(newLeftWidth);
      }
    }

    if (isDraggingRight && newRightWidth > 15 && newRightWidth < 40) {
      if (leftWidth + newRightWidth < 80) {
        setRightWidth(newRightWidth);
      }
    }
  };

  const getPanelWidth = (baseWidth: number) => {
    return isLargeScreen ? { width: `${baseWidth}%` } : { width: "100%" };
  };

  return (
    <div
      className="flex flex-col lg:flex-row w-full overflow-hidden relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <motion.div
        style={getPanelWidth(leftWidth)}
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

      <motion.div
        style={isLargeScreen ? { width: `${middleWidth}%` } : { width: "100%" }}
        className="overflow-hidden border-b lg:border-none pb-4 lg:pb-0 mb-4 lg:mb-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {memberName ? (
          <EnrollmentPanel
            selectedMemberId={selectedMemberId}
            memberName={memberName}
            memberDetails={memberDetails}
            onBatchSelect={onBatchSelect}
          />
        ) : (
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
              <User2 className="h-8 w-8 text-primary/60" />
            </motion.div>
            <p className="text-center px-4">
              <span className="block text-sm font-medium text-foreground">
                No member selected
              </span>
              <span className="block text-xs text-muted-foreground mt-1">
                Select a member to view details
              </span>
            </p>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        style={getPanelWidth(rightWidth)}
        className="lg:border-l border-border/50 overflow-hidden bg-background pt-4 lg:pt-0 lg:pl-1 duration-300"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <BatchDetailsPanel selectedBatch={selectedBatch} />
      </motion.div>
    </div>
  );
}
