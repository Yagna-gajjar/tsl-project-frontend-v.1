import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Users, Building2, Clock, X } from "lucide-react";
import type { Batch } from "@/types/batch";
import { useCallback, useEffect, useState } from "react";
import type { Response } from "@/types/response";
import { getBatch, getBatchById } from "@/api/batch.api";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

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
  fallbackLetter?: string;
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

  const [showModal, setShowModal] = useState(false);
  const [courseBatches, setCourseBatches] = useState<Batch[]>([]);
  const [loadingCourseBatches, setLoadingCourseBatches] = useState(false);
  const [requestingBatchId, setRequestingBatchId] = useState<number | null>(
    null
  );
  const [requestReason, setRequestReason] = useState("");

  const openModal = useCallback(async () => {
    if (!batch?.courseId) {
      toast({
        title: "No course",
        description: "This batch has no courseId",
        variant: "destructive",
      });
      return;
    }
    setShowModal(true);
    setLoadingCourseBatches(true);
    try {
      const res: Response<Batch[]> = await getBatch({
        courseId: Number(batch.courseId),
      });
      setCourseBatches(res?.data ?? []);
    } catch (err) {
      console.error("Failed to load batches for course:", err);
      toast({
        title: "Error",
        description: "Failed to load batches.",
        variant: "destructive",
      });
      setCourseBatches([]);
    } finally {
      setLoadingCourseBatches(false);
    }
  }, [batch?.courseId]);

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

  const coachFullName = batch?.coachName
    ? `${batch.coachName}`
    : "Unknown Coach";

  const fallbackLetter = coachFullName
    ? coachFullName.charAt(0).toUpperCase()
    : "C";

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
          <div className="flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="p-2 rounded-lg bg-primary/10"
              >
                <BookOpen className="h-5 w-5 text-primary" />
              </motion.div>

              <h3 className="text-base font-semibold text-foreground">
                {batch?.batchName}
              </h3>
            </div>
            <div>
              <Button onClick={openModal} size={"sm"}>
                View Batches
              </Button>
            </div>
          </div>
        </motion.div>

        {details.map((detail, idx) => {
          const Icon = detail.icon;

          return (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="bg-card rounded-lg border border-border/50 p-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
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
                  <div className="text-xs text-muted-foreground">
                    {detail.label}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {detail.value || "N/A"}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            key="overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50"
              onClick={() => {
                setShowModal(false);
                setRequestingBatchId(null);
                setRequestReason("");
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="relative z-10 w-full max-w-4xl bg-card rounded-2xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
                transition: { type: "spring", stiffness: 260, damping: 20 },
              }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
            >
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Batches for</div>
                    <div className="text-xs text-muted-foreground">
                      {batch?.courseName ?? "Course"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={"ghost" as any}
                    onClick={() => {
                      setShowModal(false);
                      setRequestingBatchId(null);
                      setRequestReason("");
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="p-4 max-h-[60vh] overflow-auto space-y-3">
                {loadingCourseBatches ? (
                  <div className="flex items-center justify-center py-12">
                    <svg
                      className="animate-spin h-8 w-8 text-muted-foreground"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeOpacity="0.2"
                        fill="none"
                      />
                      <path
                        d="M22 12a10 10 0 0 1-10 10"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                  </div>
                ) : courseBatches.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No other batches found for this course.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {courseBatches.map((b) => {
                      const isFull =
                        Number(b.activeMemberCount) >= Number(b.batchCapacity);
                      return (
                        <motion.div
                          key={b.batchId}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          whileHover={{
                            scale: 1.01,
                            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                          }}
                          className="flex items-center justify-between gap-4 p-3 rounded-lg bg-gradient-to-br from-card to-background border border-border/50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-foreground truncate">
                                  {b.batchName}
                                </div>
                              </div>

                              <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>
                                    {(b?.startTime as string).slice(0, 5) ??
                                      "-"}{" "}
                                    -{" "}
                                    {(b?.endTime as string).slice(0, 5) ?? "-"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" />
                                  <span>
                                    Coach:{" "}
                                    {b.coachName ? `${b.coachName}` : "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">
                                Seats
                              </div>
                              <div
                                className={`text-sm font-medium ${
                                  isFull ? "text-red-600" : "text-foreground"
                                }`}
                              >
                                {b.activeMemberCount} / {b.batchCapacity}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                <AnimatePresence>
                  {requestingBatchId && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="mt-4 bg-muted/5 p-4 rounded-lg border border-border/40"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-semibold">
                            Request spot for batch {requestingBatchId}
                          </div>
                          <textarea
                            value={requestReason}
                            onChange={(e) => setRequestReason(e.target.value)}
                            placeholder="Short reason (why do you need a spot?)"
                            className="w-full mt-2 p-2 rounded-md bg-card border border-border/40 resize-none"
                            rows={3}
                          />
                          <div className="flex items-center justify-end gap-2 mt-2">
                            <Button
                              size="sm"
                              variant={"ghost" as any}
                              onClick={() => {
                                setRequestingBatchId(null);
                                setRequestReason("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
