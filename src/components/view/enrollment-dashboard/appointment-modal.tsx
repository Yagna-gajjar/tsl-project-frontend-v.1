import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Check, X, AlertCircle, Loader2, Edit2 } from "lucide-react";
import { getBatchMember, makeAppointment } from "@/api/batchMember.api";
import type { BatchMember } from "@/types/batchMember";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getBatch } from "@/api/batch.api";
import type { Response } from "@/types/response";
import type { Batch } from "@/types/batch";
import { format } from "date-fns";

export interface EnrollmentSummary {
  enrollmentId: number;
  courseName?: string | null;
  academyName?: string | null;
  sessionUnits?: number[] | number;
  memberId?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEnrollment?: EnrollmentSummary | null;
  onAction?: (actionKey: "create" | "update" | "delete", payload?: any) => void;
}

type Row = {
  batchId?: number | string | null;
  batchText?: string;
  date?: string;
  original?: any | null;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

export default function AppointmentModal({
  open,
  onOpenChange,
  selectedEnrollment,
  onAction,
}: Props) {
  console.log(selectedEnrollment);

  const [batchMembers, setBatchMembers] = useState<BatchMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [batchOptions, setBatchOptions] = useState<Batch[] | null>(null);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const sessionUnits = selectedEnrollment?.sessionUnits;
  const rowCount = Array.isArray(sessionUnits)
    ? sessionUnits.length
    : Number(sessionUnits) || 0;

  const fetchBatchMembers = useCallback(async () => {
    setError(null);
    setBatchMembers([]);
    const enrollmentId = selectedEnrollment?.enrollmentId;
    if (!enrollmentId) return;

    setLoading(true);
    try {
      const res = await getBatchMember({
        enrollmentId: enrollmentId,
      });
      let members: any = [];
      if (Array.isArray(res)) members = res;
      else if (Array.isArray((res as any).data)) members = (res as any).data;
      else if (Array.isArray((res as any).data?.data))
        members = (res as any).data?.data;
      else {
        const possibleArray = Object.values(res || {}).find((v) =>
          Array.isArray(v)
        );
        members = possibleArray ?? [];
      }
      setBatchMembers(members as BatchMember[]);
    } catch (err: any) {
      console.error("getBatchMember error:", err);
      setError("Failed to load appointments.");
      setBatchMembers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEnrollment]);

  const loadBatches = useCallback(async (academyId?: number) => {
    setLoadingBatches(true);
    try {
      const opts: Response<Batch[]> = await getBatch({
        academyId: academyId,
      });
      setBatchOptions(opts?.data);
    } catch (e) {
      console.error("failed to load batches", e);
      setBatchOptions([]);
    } finally {
      setLoadingBatches(false);
    }
  }, []);

  useEffect(() => {
    const base: Row[] = Array.from({ length: rowCount }).map(() => ({
      batchId: null,
      batchText: "",
      date: "",
      original: null,
    }));

    for (let i = 0; i < Math.min(batchMembers.length, rowCount); i++) {
      const m: any = batchMembers[i];
      base[i] = {
        batchId: m?.batchId ?? m?.batch?.batchId ?? null,
        batchText: m?.batch?.name ?? m?.batchName ?? "",
        date: m?.appointmentDate ? toLocalDateTimeValue(m.appointmentDate) : "",
        original: m,
      };
    }

    setRows(base);
    setEditingIndex(null);
  }, [batchMembers, rowCount]);

  useEffect(() => {
    if (open && selectedEnrollment?.enrollmentId) {
      void fetchBatchMembers();
      void loadBatches(selectedEnrollment?.academyId);
    } else {
      setBatchMembers([]);
      setRows([]);
      setError(null);
      setLoading(false);
      setEditingIndex(null);
    }
  }, [open, selectedEnrollment, fetchBatchMembers]);

  function toLocalDateTimeValue(dt?: string | Date): string {
    if (!dt) return "";
    try {
      const d = typeof dt === "string" ? new Date(dt) : dt;
      const offsetMs = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offsetMs).toISOString().slice(0, 19);
    } catch {
      return String(dt);
    }
  }

  function weekdayNameFromDateIso(dtIso?: string) {
    if (!dtIso) return null;
    try {
      const d = new Date(dtIso);
      const jsIndex = d.getDay();
      return jsIndex === 0 ? 7 : jsIndex;
    } catch {
      return null;
    }
  }

  function onRowChange(index: number, patch: Partial<Row>) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
    setEditingIndex(index);
    setError(null);
  }

  function handleCancelEdit(index: number) {
    setRows((prev) => {
      const next = [...prev];
      const orig = next[index].original;
      if (orig) {
        next[index] = {
          batchId: orig.batchId ?? orig.batch?.batchId ?? null,
          batchText: orig.batch?.name ?? orig.batchName ?? "",
          date: orig.appointmentDate
            ? toLocalDateTimeValue(orig.appointmentDate)
            : "",
          original: orig,
        };
      } else {
        next[index] = {
          batchId: null,
          batchText: "",
          date: "",
          original: null,
        };
      }
      return next;
    });
    setEditingIndex(null);
    setError(null);
  }

  async function handleSaveEdit(index: number) {
    const r = rows[index];
    if (!r) return;

    if (!(r.batchId || (r.batchText && r.batchText.trim() !== ""))) {
      setError("Batch is required.");
      return;
    }
    if (!r.date) {
      setError("Date is required.");
      return;
    }

    setError(null);

    if (r.original && (r.original as any).id) {
      onAction?.("update", {
        enrollmentId: selectedEnrollment?.enrollmentId,
        appointmentId: (r.original as any).id,
        sessionIndex: index,
        batch:
          batchOptions && r.batchId
            ? { batchId: r.batchId }
            : { batchName: r.batchText ?? "" },
        appointmentDate: r.date,
      });
      setEditingIndex(null);
      return;
    }

    const batchIdValue = batchOptions ? Number(r.batchId) : null;
    const startDate = r.date;
    const endDate = r.date;
    const payloadAppt = {
      batchId: batchIdValue,
      memberId: selectedEnrollment?.memberId ?? null,
      enrollmentId: selectedEnrollment?.enrollmentId,
      status: "active",
      startDate,
      endDate,
      weekDays: weekdayNameFromDateIso(r.date),
    };

    try {
      const res = await makeAppointment([payloadAppt]);
      const created =
        Array.isArray(res?.data) && res.data.length > 0 ? res.data[0] : null;

      if (created) {
        setRows((prev) => {
          const next = [...prev];
          next[index] = {
            batchId:
              created.batchid ?? created.batchId ?? batchIdValue ?? r.batchId,
            batchText:
              created.batchname ?? created.batchName ?? r.batchText ?? "",
            date: created.startdate ?? created.startDate ?? r.date,
            original: created,
          };
          return next;
        });
      } else {
        setRows((prev) => {
          const next = [...prev];
          next[index] = { ...next[index], original: payloadAppt };
          return next;
        });
      }

      setEditingIndex(null);
    } catch (err: any) {
      console.error("Failed to call makeAppointments", err);
      setError(err?.message ?? "Failed to create appointment");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] w-[95%] rounded-2xl p-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-0 shadow-2xl overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div>
              <DialogTitle className="text-2xl font-bold text-foreground">
                Manage Appointments
              </DialogTitle>
              <p className="text-gray-500 text-sm mt-1">
                {selectedEnrollment?.courseName || "Course Appointments"}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="overflow-y-auto px-6 max-h-[calc(90vh-150px)]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col items-center justify-center py-12 gap-3"
              >
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-slate-600 dark:text-slate-300">
                  Loading appointments...
                </p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-200">{error}</p>
              </motion.div>
            ) : rowCount > 0 ? (
              <motion.div
                key="rows"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {rows.map((r, idx) => {
                  const isEditing = editingIndex === idx;
                  const hasData = !!r.batchId || !!r.batchText || !!r.date;

                  return (
                    <motion.div
                      key={`row-${idx}`}
                      variants={itemVariants}
                      className="group"
                    >
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500">
                        <div className="flex items-center gap-4 mb-4">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 font-bold text-blue-600 dark:text-blue-300 text-sm"
                          >
                            {idx + 1}
                          </motion.div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                              Session {idx + 1}
                            </p>
                          </div>
                          {hasData && !isEditing && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-2"
                            >
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                Scheduled
                              </span>
                            </motion.div>
                          )}
                        </div>

                        <div className="flex gap-3 justify-between items-center">
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              Batch
                            </label>
                            {loadingBatches ? (
                              <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                              </div>
                            ) : batchOptions ? (
                              <motion.select
                                whileFocus={{ scale: 1.02 }}
                                value={String(r.batchId ?? "")}
                                onChange={(e) =>
                                  onRowChange(idx, {
                                    batchId:
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value),
                                  })
                                }
                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                              >
                                <option value="">Select a batch</option>
                                {batchOptions.map((b, i) => (
                                  <option key={i} value={b.batchId}>
                                    {`${b.batchName} | ${format(
                                      new Date(`2023-01-01T${b.startTime}`),
                                      "hh:mm a"
                                    )} - ${format(
                                      new Date(`2023-01-01T${b.endTime}`),
                                      "hh:mm a"
                                    )} | Seats: ${b.activeMemberCount} / ${
                                      b.maxCapacity
                                    }`}
                                  </option>
                                ))}
                              </motion.select>
                            ) : (
                              <motion.input
                                whileFocus={{ scale: 1.02 }}
                                value={r.batchText ?? ""}
                                onChange={(e) =>
                                  onRowChange(idx, {
                                    batchText: e.target.value,
                                  })
                                }
                                placeholder="Enter batch name"
                                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                              />
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              Date
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                              <motion.input
                                whileFocus={{ scale: 1.02 }}
                                type="date"
                                value={r.date ?? ""}
                                onChange={(e) =>
                                  onRowChange(idx, { date: e.target.value })
                                }
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isEditing && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex gap-3 mt-5 pt-4 border-t border-slate-200 dark:border-slate-700"
                            >
                              <motion.button
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => handleSaveEdit(idx)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:shadow-lg transition-all"
                              >
                                <Check className="w-4 h-4" />
                                Save
                              </motion.button>

                              <motion.button
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => handleCancelEdit(idx)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </motion.button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {!isEditing && hasData && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end"
                          >
                            <motion.button
                              variants={buttonVariants}
                              whileHover="hover"
                              whileTap="tap"
                              onClick={() => setEditingIndex(idx)}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit
                            </motion.button>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col items-center justify-center py-12 gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-medium">
                  No session units found
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Add sessions to get started
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end"
        >
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => onOpenChange(false)}
            className="px-6 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
          >
            Close
          </motion.button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
