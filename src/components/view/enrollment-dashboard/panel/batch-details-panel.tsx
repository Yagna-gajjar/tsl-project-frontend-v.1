"use client";

import { motion } from "framer-motion";
import { BookOpen, Users, Building2 } from "lucide-react";
import type { Batch } from "@/types/batch";
import { useEffect, useState } from "react";
import type { Response } from "@/types/response";
import { getBatchById } from "@/api/batch.api";

interface BatchDetailsPanelProps {
  selectedBatch: number | null;
}

interface DetailItem {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number | undefined;
  colorClass?: string;
  iconColor?: string;
  imageUrl?: string;
  fallbackLetter?: string; // <-- For initials avatar
}

export default function BatchDetailsPanel({
  selectedBatch,
}: BatchDetailsPanelProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 10 },
    visible: { opacity: 1, x: 0 },
  };

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBatch = async (id: number) => {
      setLoading(true);
      setBatch(null);
      try {
        const res: Response<Batch | any> = await getBatchById(id);
        if (res) {
          setBatch(res?.data);
        }
      } catch (err) {
        console.error("Failed to fetch batch:", err);
      } finally {
        setLoading(false);
      }
    };

    if (selectedBatch != null) {
      fetchBatch(selectedBatch);
    }
  }, [selectedBatch]);

  useEffect(() => {
    if (batch) console.log("Updated batch:", batch);
  }, [batch]);

  if (selectedBatch == null) {
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
          <span className="block text-sm font-medium text-foreground">
            No batch selected
          </span>
          <span className="block text-xs text-muted-foreground mt-1">
            Select a batch to view details
          </span>
        </p>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <svg className="mr-3 size-5 animate-spin ..." viewBox="0 0 24 24"></svg>
    );
  }

  const coachFullName =
    batch?.coachFirstName && batch?.coachLastName
      ? `${batch.coachFirstName} ${batch.coachLastName}`
      : batch?.coachFirstName || "Unknown Coach";

  const fallbackLetter = coachFullName ? coachFullName.charAt(0).toUpperCase() : "C";

  const details: DetailItem[] = [
    {
      label: "Coach",
      value: coachFullName,
      colorClass: "bg-accent/10",
      iconColor: "text-accent",
      imageUrl: batch?.photo
        ? `${import.meta.env.VITE_APP_R2_PUBLIC_ENDPOINT}/${batch.photo}`
        : undefined,
      fallbackLetter,
    },
    {
      icon: BookOpen,
      label: "Course",
      value: batch?.courseName,
      colorClass: "bg-secondary/10",
      iconColor: "text-secondary-foreground",
    },
    {
      icon: Building2,
      label: "Facility",
      value: batch?.facilityName,
      colorClass: "bg-blue-500/10",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <motion.div
      className="h-full overflow-y-auto bg-background p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="space-y-3">
        <motion.div variants={itemVariants} className="mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="p-2 rounded-lg bg-primary/10"
            >
              <BookOpen className="h-5 w-5 text-primary" />
            </motion.div>

            <div>
              <h3 className="text-base font-semibold text-foreground">
                {batch?.batchName}
              </h3>
              <div className="text-xs text-muted-foreground">
                ID: {batch?.batchId}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Details Render */}
        {details.map((detail, idx) => {
          const Icon = detail.icon;

          return (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="bg-card rounded-lg border border-border/50 p-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                {/* Show image → else initial avatar → else icon */}
                {detail.imageUrl ? (
                  <motion.img
                    whileHover={{ scale: 1.1 }}
                    src={detail.imageUrl}
                    alt={`${detail.label} Photo`}
                    className="h-10 w-10 rounded-full object-cover border flex-shrink-0"
                  />
                ) : detail.fallbackLetter ? (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="h-10 w-10 rounded-full bg-accent/20 text-black flex items-center justify-center text-accent font-semibold text-sm border flex-shrink-0"
                  >
                    {detail.fallbackLetter}
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`p-2 rounded-lg ${detail.colorClass} flex-shrink-0`}
                  >
                    {Icon && <Icon className={`h-4 w-4 ${detail.iconColor}`} />}
                  </motion.div>
                )}

                <div>
                  <div className="text-xs text-muted-foreground">{detail.label}</div>
                  <div className="text-sm font-medium text-foreground">
                    {detail.value || "N/A"}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
