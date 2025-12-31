"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { X, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { AcceptRequest, updateBatchMember } from "@/api/enrollmentActions.api";
import { getEnrollmentById } from "@/api/enrollment.api";
import type { Response } from "@/types/response";
import type { BatchMember } from "@/types/batchMember";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAccepted?: () => void;
  requestData: BatchMember[];
  setRequestLen: Dispatch<SetStateAction<number>>;
};

export default function AcceptBatchRequest({
  isOpen,
  onClose,
  onAccepted,
  requestData,
  setRequestLen,
}: Props) {
  const [loading] = useState(false);
  const [requests, setRequests] = useState<BatchMember[]>(requestData);
  const [acceptingIds, setAcceptingIds] = useState<Record<number, boolean>>({});
  const [rejectingIds, setRejectingIds] = useState<Record<number, boolean>>({});
  const [expandedRejectIds, setExpandedRejectIds] = useState<
    Record<number, boolean>
  >({});
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>(
    {}
  );

  const subtractOneDayIso = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const prev = new Date(d.getTime() - 24 * 60 * 60 * 1000);
      return prev.toISOString().split("T")[0];
    } catch {
      return null;
    }
  };

  const handleAccept = async (item: BatchMember) => {
    if (acceptingIds[item.batchMemberId as any]) return;
    setAcceptingIds((s) => ({ ...s, [item.batchMemberId as any]: true }));

    try {
      const enrollmentRes: Response | any = await getEnrollmentById(
        item.enrollmentNo as any
      );

      if (!enrollmentRes.success) {
        console.error("Enrollment fetch failed");
        throw new Error(`Enrollment fetch failed `);
      }
      const enrollment = enrollmentRes?.data;
      const oldBatchId = enrollment?.batchId;
      const enrollmentMemberId = enrollment?.memberId;
      const enrollmentEndDate = enrollment?.endDate;

      let computedOldBatchEndDate: string | null = null;

      const todayStr = new Date().toISOString().split("T")[0];
      const todayDate = new Date(todayStr);

      const yesterday = new Date(todayDate.getTime() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      if (item.startDate) {
        const startDateObj = new Date(item.startDate);

        if (startDateObj < todayDate) {
          computedOldBatchEndDate = yesterday;
        } else {
          const minusOne = subtractOneDayIso(item.startDate as any);
          if (minusOne) computedOldBatchEndDate = minusOne;
        }
      }

      if (!computedOldBatchEndDate && enrollmentEndDate) {
        try {
          computedOldBatchEndDate = new Date(enrollmentEndDate)
            .toISOString()
            .split("T")[0];
        } catch {
          computedOldBatchEndDate = enrollmentEndDate;
        }
      }

      const memberIdToSend = item.memberId || enrollmentMemberId;

      if (
        !oldBatchId ||
        !item.batchId ||
        !computedOldBatchEndDate ||
        !memberIdToSend
      ) {
        console.error("Missing required data:", {
          oldBatchId,
          newBatchId: item.batchId,
          computedOldBatchEndDate,
          memberIdToSend,
        });
        throw new Error(
          "Missing required data to accept change (oldBatchId/newBatchId/oldBatchEndDate/memberId)."
        );
      }

      const body = {
        oldBatchId,
        newBatchId: item.batchId,
        oldBatchEndDate: computedOldBatchEndDate,
        memberId: memberIdToSend,
      };

      const acceptRes: Response | any = await AcceptRequest(body);

      if (!acceptRes.success) {
        throw new Error("Accept API failed:");
      }

      try {
        setRequestLen((prev: any) => prev - 1);
        toast({
          title: "Success",
          description: "Batch change accepted.",
        });
      } catch (e) {
        toast({
          title: "Success",
          description: "Batch change accepted (non-JSON response).",
        });
      }

      setRequests((prev) =>
        prev.filter((r) => r.batchMemberId !== item.batchMemberId)
      );
      if (onAccepted) onAccepted();
    } catch {
      toast({
        title: "Error",
        description: "Failed to accept",
        variant: "destructive",
      });
    }
  };

  const handleReject = (item: BatchMember) => {
    setExpandedRejectIds((s) => ({
      ...s,
      [item.batchMemberId as any]: !s[item.batchMemberId as any],
    }));
    if (!rejectReasons[item.batchMemberId as any]) {
      setRejectReasons((s) => ({ ...s, [item.batchMemberId as any]: "" }));
    }
  };

  const submitReject = async (item: BatchMember) => {
    const id = item.batchMemberId;
    const reason = rejectReasons[id as any] || "";

    if (rejectingIds[id as any]) return;
    setRejectingIds((s) => ({ ...s, [id as any]: true }));

    try {
      const oldReason =  "";
      const parts = [];
      if (String(oldReason).trim()) parts.push(String(oldReason).trim());
      if (String(reason).trim())
        parts.push(`operator: ${String(reason).trim()}`);
      const finalReason = parts.join(", ");

      const body: { status: string; reason: string } = {
        status: "rejected",
        reason: finalReason,
      };

      const res = await updateBatchMember(Number(id), body);

      if (!res.success) {
        throw new Error(`Failed to update`);
      }

      setRequests((prev) => prev.filter((r) => r.batchMemberId !== id));

      try {
        setRequestLen((prev: number) => prev - 1);
        toast({
          title: "Rejected",
          description: "Request rejected successfully.",
        });
      } catch {
        toast({
          title: "Rejected",
          description: "Request rejected successfully.",
        });
      }

      setExpandedRejectIds((s) => {
        const copy = { ...s };
        delete copy[id as any];
        return copy;
      });
      setRejectReasons((s) => {
        const copy = { ...s };
        delete copy[id as any];
        return copy;
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Reject failed",
        variant: "destructive",
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-[60]"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 z-[70] h-full w-full md:w-1/2 bg-background shadow-xl border-l border-border overflow-y-auto"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold">Batch Switch Requests</h3>
                <p className="text-sm text-muted-foreground">
                  Pending requests from members
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No pending requests
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((item) => {
                    const isAccepting = !!acceptingIds[item.batchMemberId as any];
                    const isRejecting = !!rejectingIds[item.batchMemberId as any];
                    const isExpanded = !!expandedRejectIds[item.batchMemberId as any];
                    const rejectReason =
                      rejectReasons[item.batchMemberId as any] || "";
                    const start = item.startDate
                      ? new Date(item.startDate).toLocaleDateString()
                      : "-";
                    const end = item.endDate
                      ? new Date(item.endDate).toLocaleDateString()
                      : "-";

                    return (
                      <div
                        key={item.batchMemberId}
                        className="rounded-lg border p-3 bg-card flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="rounded-full bg-blue-600/10 w-9 h-9 flex items-center justify-center text-blue-600 font-semibold">
                                {String(item.memberFirstName || item.memberId)
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div className="truncate">
                                <div className="font-medium text-sm">
                                  {item.memberFirstName || `Member ${item.memberId}`}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {item.batchName || `Batch ${item.batchId}`}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 text-sm text-muted-foreground space-y-1">
                              <div>
                                <strong>Dates:</strong> {start} — {end}
                              </div>
                              {/* {item.reason && (
                                <div>
                                  <strong>Reason:</strong> {item.reason}
                                </div>
                              )} */}
                              {/* <div className="text-xs">
                                Requested:{" "}
                                {new Date(item.createdAt as string).toLocaleString()}
                              </div> */}
                            </div>
                          </div>

                          <div className="flex items-end gap-2">
                            <button
                              onClick={() => handleAccept(item)}
                              disabled={isAccepting}
                              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-60"
                            >
                              {isAccepting ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />{" "}
                                  Accepting...
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4" /> Accept
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(item)}
                              disabled={isRejecting}
                              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                            >
                              {isRejecting ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />{" "}
                                  Rejecting...
                                </>
                              ) : (
                                <>
                                  <X className="w-4 h-4" /> Reject
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="space-y-3">
                              <div className="rounded-md p-3 bg-muted/30 border border-border">
                                <div className="">
                                  <label className="block text-sm font-medium mb-2">
                                    Rejection Reason
                                  </label>
                                  <textarea
                                    value={rejectReason}
                                    onChange={(e) =>
                                      setRejectReasons((s) => ({
                                        ...s,
                                        [item.batchMemberId as any]: e.target.value,
                                      }))
                                    }
                                    className="w-full border rounded-md p-2 text-sm bg-background resize-none"
                                    rows={4}
                                    placeholder="Enter reason for rejection..."
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleReject(item)}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/70 text-sm"
                                >
                                  <X className="w-4 h-4" /> Close
                                </button>
                                <button
                                  onClick={() => submitReject(item)}
                                  disabled={!rejectReason.trim() || isRejecting}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 text-sm"
                                >
                                  {isRejecting ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />{" "}
                                      OK
                                    </>
                                  ) : (
                                    "OK"
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
