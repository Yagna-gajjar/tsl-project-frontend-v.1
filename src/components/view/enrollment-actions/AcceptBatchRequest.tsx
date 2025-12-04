"use client";

import React, { useEffect, useState, useCallback } from "react";
import { X, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

type RequestItem = {
  batchMemberId: number;
  batchId: number;
  memberId: number;
  status: string;
  enrollmentId: number;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
  reason?: string | null;
  batchName?: string | null;
  memberName?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  // optional callback to refresh parent view after accept
  onAccepted?: () => void;
};

export default function AcceptBatchRequest({ isOpen, onClose, onAccepted }: Props) {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [acceptingIds, setAcceptingIds] = useState<Record<number, boolean>>({});

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:9705/api/batch-member/request");
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok) {
        throw new Error(
          json?.message || `Failed to load requests (${res.status})`
        );
      }
      setRequests(json?.data || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch requests";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen, fetchRequests]);

  // Accept handler: fetch enrollment to get oldBatchId + oldBatchEndDate, then call accept endpoint
  // inside BatchSwitchSidebar: improved handleAccept
  // defensive handleAccept - use this in BatchSwitchSidebar.tsx
  const handleAccept = async (item: RequestItem) => {
    if (acceptingIds[item.batchMemberId]) return;
    setAcceptingIds((s) => ({ ...s, [item.batchMemberId]: true }));

    try {
      // 1) Fetch enrollment (text first)
      const enrollmentRes = await fetch(
        `http://localhost:9705/api/enrollment/${item.enrollmentId}`,
        {
          headers: { Accept: "application/json" },
        }
      );
      const enrollmentText = await enrollmentRes.text();

      if (!enrollmentRes.ok) {
        console.error(
          "Enrollment fetch failed:",
          enrollmentRes.status,
          enrollmentText
        );
        // If HTML, log first 1000 chars to console to avoid spam
        const snippet = enrollmentText.slice(0, 1000);
        console.error("Enrollment response snippet:", snippet);
        throw new Error(
          enrollmentText || `Enrollment fetch failed (${enrollmentRes.status})`
        );
      }

      // parse if JSON, else throw with helpful message
      let enrollmentJson: any = null;
      try {
        enrollmentJson = enrollmentText ? JSON.parse(enrollmentText) : null;
      } catch (e) {
        console.error(
          "Enrollment endpoint returned non-JSON:",
          enrollmentText.slice(0, 2000)
        );
        throw new Error(
          "Enrollment endpoint returned non-JSON (HTML or text). Check server logs or paste response here."
        );
      }

      const enrollment = enrollmentJson?.data || enrollmentJson;
      const oldBatchId = enrollment?.batchId;
      const oldBatchEndDate = enrollment?.endDate;

      if (!oldBatchId || !item.batchId || !oldBatchEndDate) {
        console.error("Missing required data:", {
          oldBatchId,
          newBatchId: item.batchId,
          oldBatchEndDate,
        });
        throw new Error(
          "Missing required data to accept change (oldBatchId/newBatchId/endDate)."
        );
      }

      // 2) call accept endpoint
      const body = { oldBatchId, newBatchId: item.batchId, oldBatchEndDate };
      const acceptRes = await fetch(
        "http://localhost:9705/api/batch-member/accept",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const acceptText = await acceptRes.text();

      if (!acceptRes.ok) {
        console.error(
          "Accept API failed:",
          acceptRes.status,
          acceptText.slice(0, 2000)
        );
        // show readable error
        const errMsg =
          acceptText || `Accept request failed (${acceptRes.status})`;
        throw new Error(errMsg);
      }

      // try parse JSON success response but accept non-JSON too
      try {
        const acceptJson = acceptText ? JSON.parse(acceptText) : null;
        toast({
          title: "Success",
          description: acceptJson?.message || "Batch change accepted.",
        });
      } catch (e) {
        // server returned non-JSON success (rare) — still OK
        console.warn(
          "Accept endpoint returned non-JSON success:",
          acceptText.slice(0, 500)
        );
        toast({
          title: "Success",
          description: "Batch change accepted (non-JSON response).",
        });
      }

      // remove request locally
      setRequests((prev) =>
        prev.filter((r) => r.batchMemberId !== item.batchMemberId)
      );
      if (onAccepted) onAccepted();
    } catch (err) {
      console.error("handleAccept error:", err);
      const message =
        err instanceof Error ? err.message : "Failed to accept request";
      // If message looks like HTML, suggest copy/paste
      if (typeof message === "string" && message.trim().startsWith("<")) {
        toast({
          title: "Server returned HTML",
          description:
            "Server returned HTML instead of JSON. Check backend logs or paste response into chat.",
          variant: "destructive",
        });
        // also log more to console
        console.error(
          "Full server HTML response (first 5000 chars):",
          message.slice(0, 5000)
        );
      } else {
        toast({ title: "Error", description: message, variant: "destructive" });
      }
    } finally {
      setAcceptingIds((s) => {
        const copy = { ...s };
        delete copy[item.batchMemberId];
        return copy;
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-[60]"
          />

          {/* Sidebar */}
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
                    const isAccepting = !!acceptingIds[item.batchMemberId];
                    // format dates
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
                                {String(item.memberName || item.memberId)
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </div>
                              <div className="truncate">
                                <div className="font-medium text-sm">
                                  {item.memberName || `Member ${item.memberId}`}
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
                              {item.reason && (
                                <div>
                                  <strong>Reason:</strong> {item.reason}
                                </div>
                              )}
                              <div className="text-xs">
                                Requested:{" "}
                                {new Date(item.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
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
                          </div>
                        </div>
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
