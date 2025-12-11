import { useCallback, useEffect, useState } from "react";
import { getBatchMember, makeAppointment } from "@/api/batchMember.api";
import { BatchMember } from "@/types/batchMember";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getBatch } from "@/api/batch.api";
import type { Response } from "@/types/response";
import type { Batch } from "@/types/batch";
import { format } from "date-fns";

export interface EnrollmentSummary {
  enrollmentId: number;
  courseName?: string | null;
  academyName?: string | null;
  sessionUnits?: number[] | number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEnrollment?: EnrollmentSummary | null;
  onAction?: (actionKey: "create" | "update" | "delete", payload?: any) => void;
}

export default function AppointmentModal({
  open,
  onOpenChange,
  selectedEnrollment,
  onAction,
}: Props) {
  const [batchMembers, setBatchMembers] = useState<BatchMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  console.log(selectedEnrollment, " = from appointment");

  type Row = {
    batchId?: number | string | null;
    batchText?: string;
    date?: string;
    original?: any | null;
  };
  const [rows, setRows] = useState<Row[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [batchOptions, setBatchOptions] = useState<Batch[] | null>(null);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const sessionUnits = selectedEnrollment?.sessionUnits;
  const rowCount = Array.isArray(sessionUnits)
    ? sessionUnits.length
    : Number(sessionUnits) || 0;

  // ------------- fetch batch members ----------------
  const fetchBatchMembers = useCallback(async () => {
    setError(null);
    setBatchMembers([]);
    const enrollmentId = selectedEnrollment?.enrollmentId;
    if (!enrollmentId) return;

    setLoading(true);
    try {
      const res = await getBatchMember(enrollmentId);
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

  // ------------- load batches (by course name) ----------------
  const loadBatches = useCallback(async (courseName?: string | null) => {
    setLoadingBatches(true);
    try {
      const opts: Response<Batch[]> = await getBatch({
        courseName: courseName,
      });
      setBatchOptions(opts?.data);
    } catch (e) {
      console.error("failed to load batches", e);
      setBatchOptions([]);
    } finally {
      setLoadingBatches(false);
    }
  }, []);

  // ------------- rows initialization ----------------
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

  // load data when modal opens
  useEffect(() => {
    if (open && selectedEnrollment?.enrollmentId) {
      void fetchBatchMembers();
      // load batches for course
      void loadBatches(selectedEnrollment?.courseName);
    } else {
      setBatchMembers([]);
      setRows([]);
      setError(null);
      setLoading(false);
      setEditingIndex(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedEnrollment, fetchBatchMembers]);

  // ------------- helpers ----------------
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

  // ------------- editing handlers ----------------
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

  // ------------- Save for a row -> POST to makeAppointments for new rows -------------
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

    // If this row already has an original with an id -> consider it 'existing' -> bubble update
    if (r.original && (r.original as any).id) {
      // bubble update - user said they have separate update handling
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
      // POST to your controller (adjust URL if your route differs)
      const res = await makeAppointment(payloadAppt);

      // API returns created rows in data.data (per your earlier controller)
      const created =
        Array.isArray(res?.data) && res.data.length > 0 ? res.data[0] : null;

      if (created) {
        // update row to reflect inserted DB record
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
        // If controller returned a different shape, let's at least keep UI in saved state
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

  function handleDelete(index: number) {
    const orig = rows[index]?.original;
    if (!orig) return;
    const payload = {
      enrollmentId: selectedEnrollment?.enrollmentId,
      appointmentId: (orig as any).id ?? orig?.appointmentId ?? null,
      sessionIndex: index,
      original: orig,
    };
    onAction?.("delete", payload);
  }

  // ------------- render ----------------
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[90vh] w-[95%] rounded-xl p-6 bg-white border-0 shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Appointment List
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 overflow-auto no-scrollbar">
          {loading ? (
            <p className="text-slate-500 text-center">
              Loading appointments...
            </p>
          ) : error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : rowCount > 0 ? (
            rows.map((r, idx) => {
              const isExisting = !!r.original;
              const isEditing = editingIndex === idx;
              return (
                <div
                  key={`row-${idx}`}
                  className="flex flex-col gap-2 border p-3 rounded-lg bg-white"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 text-slate-700 font-medium">
                      #{idx + 1}
                    </div>

                    <div className="flex-1 flex items-center gap-3">
                      {loadingBatches ? (
                        <div className="text-sm text-slate-500">
                          Loading batches...
                        </div>
                      ) : batchOptions ? (
                        <select
                          value={String(r.batchId ?? "")}
                          onChange={(e) =>
                            onRowChange(idx, {
                              batchId:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                          className="p-2 border rounded"
                          style={{ minWidth: 180 }}
                        >
                          <option value="">Select batch</option>
                          {batchOptions.map((b, i) => (
                            <option key={i} value={b.batchId}>
                              {`${b.batchName} | ${format(
                                new Date(`2023-01-01T${b.startTime}`),
                                "hh:mm a"
                              )} - ${format(
                                new Date(`2023-01-01T${b.endTime}`),
                                "hh:mm a"
                              )} | Seats: ${b.activeMemberCount} / ${
                                b.batchCapacity
                              }`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          value={r.batchText ?? ""}
                          onChange={(e) =>
                            onRowChange(idx, { batchText: e.target.value })
                          }
                          placeholder="Batch name"
                          className="p-2 border rounded"
                          style={{ minWidth: 180 }}
                        />
                      )}

                      <input
                        type="Date"
                        value={r.date ?? ""}
                        onChange={(e) =>
                          onRowChange(idx, { date: e.target.value })
                        }
                        className="p-2 border rounded flex-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {isExisting && (
                        <button
                          onClick={() => handleDelete(idx)}
                          className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-3 mt-1 pl-12">
                      <button
                        onClick={() => handleSaveEdit(idx)}
                        className="px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 text-sm"
                      >
                        Save
                      </button>

                      <button
                        onClick={() => handleCancelEdit(idx)}
                        className="px-3 py-1 rounded-md border bg-white text-sm hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-slate-500 text-center">
              No session units found.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
