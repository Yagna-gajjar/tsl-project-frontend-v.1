"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, AlertCircle } from "lucide-react";
import type { Member } from "@/types/member";
import type { Batch } from "@/types/batch";
import EnrollmentFormNew from "../enrollment-form-modal";

interface EnrollmentPanelProps {
  selectedMemberId: number | null;
  memberName: string | null;
  memberDetails: Member | null;
  onBatchSelect: (batch: Batch | null) => void;
}

export default function EnrollmentPanel({
  selectedMemberId,
  memberName,
  onBatchSelect,
}: EnrollmentPanelProps) {
  const [error, _] = useState<string | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  if (!selectedMemberId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/5 gap-3"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          className="p-3 rounded-full bg-primary/10"
        >
          <FileText className="h-8 w-8 text-primary/60" />
        </motion.div>
        <p className="text-center">
          <span className="block text-sm font-medium text-foreground">
            Select a member
          </span>
          <span className="block text-xs text-muted-foreground mt-1">
            to view enrollment form
          </span>
        </p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        className="h-full w-full overflow-y-auto flex flex-grow no-scrollbar bg-background"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <EnrollmentFormNew
          memberId={selectedMemberId}
          memberName={memberName as string}
          onBatchSelect={onBatchSelect as any}
        />
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 px-4 py-3 bg-destructive text-destructive-foreground rounded-lg text-sm flex items-center gap-2 shadow-lg"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </motion.div>
      )}
    </>
  );
}
