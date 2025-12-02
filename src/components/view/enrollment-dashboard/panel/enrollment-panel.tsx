"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, AlertCircle } from "lucide-react";
import type { Member } from "@/types/member";
import type { Batch } from "@/types/batch";
import { getBatch } from "@/api/batch.api";
import EnrollmentFormModal from "@/components/view/enrollment-dashboard/enrollment-form-modal";

interface EnrollmentPanelProps {
  selectedMemberId: number | null;
  memberDetails: Member | null;
  selectedBatch: Batch | null;
  onBatchSelect: (batch: Batch | null) => void;
}

export default function EnrollmentPanel({
  selectedMemberId,
  memberDetails,
  onBatchSelect,
}: EnrollmentPanelProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<Member | undefined>();

  // Fetch batches when member selected
  useEffect(() => {
    if (!selectedMemberId) {
      setBatches([]);
      onBatchSelect(null);
      return;
    }

    let mounted = true;
    getBatch({ limit: 200 })
      .then((res: any) => {
        if (!mounted) return;
        const data: Batch[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : res?.batches ?? [];
        setBatches(data);

        // Auto-select batch if member has enrollment info
        const batchId =
          (memberDetails as any)?.enrollment?.batchId ??
          (memberDetails as any)?.currentEnrollment?.batchId ??
          (memberDetails as any)?.batchId ??
          undefined;

        if (batchId) {
          const found = data.find(
            (b) => (b as any).batchId === batchId || (b as any).id === batchId
          );
          if (found) onBatchSelect(found);
        }
      })
      .catch((err) => {
        console.error("getBatch error", err);
        setError("Failed to load batches");
      })
      .finally(() => mounted);

    return () => {
      mounted = false;
    };
  }, [selectedMemberId, memberDetails, onBatchSelect]);

  const handleSaved = () => {
    setFormOpen(false);
    setEditRow(undefined);
  };

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
        className="h-full overflow-y-auto bg-background p-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-2xl space-y-4">
          <EnrollmentFormModal
            isOpen={true}
            initialData={editRow}
            onClose={() => {
              setFormOpen(false);
              setEditRow(undefined);
            }}
            onSave={handleSaved}
          />
        </div>
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
