import { deleteBatch, getBatch, getBatchById } from "@/api/batch.api";
import type { Batch } from "@/types/batch";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Users, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

interface ReassignmentBatchMember {
  batchMemberId: number;
  batchId: number;
  memberId: number;
  enrollmentNo: number;
  daysPattern: number;
  startDate: string;
  endDate: string;
  level: number;
  startTime: string;
  endTime: string;
  status: string;
}

export default function BatchChangeBulk() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [oldBatch, setOldBatch] = useState<Batch | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [loading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  // Raw input value (updates instantly) vs debounced value (drives the API call)
  const [searchInput, setSearchInput] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const [filters] = useState<Record<string, string | number | undefined>>({});
  const [sortBy] = useState<string>("batchId");
  const [sortOrder] = useState<"ASC" | "DESC">("ASC");
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const { batch_id, reassignment_batchMember } = (location.state || {}) as {
    batch_id?: number;
    reassignment_batchMember?: ReassignmentBatchMember[];
  };

  const members: ReassignmentBatchMember[] = reassignment_batchMember || [];

  console.log(members);

  // Debounce: only push searchInput -> search 400ms after the user stops typing,
  // so we don't hit the API on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);

    return () => clearTimeout(handle);
  }, [searchInput]);

  // Load the old batch details for display
  const loadOldBatch = useCallback(async () => {
    if (!batch_id) return;
    try {
      const res = await getBatchById(batch_id);
      setOldBatch(res?.data ?? null);
    } catch (err) {
      console.error("Failed to fetch old batch", err);
      setOldBatch(null);
    }
  }, [batch_id]);

  // Load all other active batches to pick a destination from
  const loadAllBatch = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getBatch({
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
        batchName: filters.batchName as string,
        status: "active",
        activityName: filters.activityName as string,
        entityName: filters.entityName as string,
        batchType: filters.batchType as string,
        admissionCriteria: filters.admissionCriteria as string,
      });

      const rowsRaw = res?.data || [];
      const rows = rowsRaw
        .map((r: any) => ({
          ...r,
          createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
          updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
        }))
        // exclude the current/old batch from the selectable list
        .filter((r: Batch) => r.batchId !== batch_id) as Batch[];

      setBatches(rows);
      setTotal(res?.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch batches", err);
      setBatches([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, filters, batch_id]);

  useEffect(() => {
    loadOldBatch();
  }, [loadOldBatch]);

  useEffect(() => {
    loadAllBatch();
  }, [loadAllBatch]);

  const handleReassign = async () => {
    if (!selectedBatchId || !batch_id || members.length === 0) return;

    try {
      setSubmitting(true);
      await deleteBatch(batch_id, selectedBatchId);
      navigate(-1);
    } catch (err) {
      console.error("Failed to reassign batch members", err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-150"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Bulk Batch Change</h1>
            <p className="text-sm text-gray-500">Move selected members into a new batch</p>
          </div>
        </div>

        {/* Two-column layout: left = current batch + members, right = batch picker.
            Each column has a fixed height and scrolls internally — the page itself doesn't scroll. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT: current batch + members */}
          <section className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-[600px]">
            {/* Current batch (fixed, not scrollable) */}
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                Current Batch
              </h2>
              {oldBatch ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-0.5">Name</div>
                    <div className="font-medium text-gray-800 truncate">{oldBatch.batchName}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-0.5">Activity</div>
                    <div className="font-medium text-gray-800 truncate">{oldBatch.activityName}</div>
                  </div>
                </div>
              ) : (
                <div className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              )}
            </div>

            {/* Members header (fixed) */}
            <div className="px-5 pt-4 pb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="font-medium text-gray-900">Members ({members.length})</h2>
            </div>

            {/* Members list (scrolls within this section only) */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5">
              {members.length > 0 ? (
                <div className="space-y-2">
                  {members.map((m) => (
                    <div
                      key={m.batchMemberId}
                      className="border border-gray-100 rounded-lg p-3 text-sm hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {m.memberFirstName} {m.middleName} {m.memnberLastName}
                        </span>
                        <span className="text-xs text-gray-500">Pattern {m.daysPattern}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(m.startDate).toLocaleDateString()} –{" "}
                        {new Date(m.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                  No members selected.
                </div>
              )}
            </div>
          </section>

          {/* RIGHT: choose new batch */}
          <section className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-[600px]">
            {/* Search + heading (fixed) */}
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-medium text-gray-900 mb-3">Select New Batch</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search batches…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none transition-all duration-150 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Batch list (scrolls within this section only) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {batches.map((b) => {
                    const isSelected = selectedBatchId === b.batchId;
                    return (
                      <label
                        key={b.batchId}
                        className={`flex items-center justify-between gap-3 border rounded-lg p-3 cursor-pointer transition-all duration-150 ${isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-gray-200 hover:border-primary/40 hover:bg-gray-50"
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="radio"
                            name="newBatch"
                            checked={isSelected}
                            onChange={() => setSelectedBatchId(b.batchId)}
                            className="accent-primary w-4 h-4 shrink-0"
                          />
                          <div className="text-sm min-w-0">
                            <div className="font-medium text-gray-900 truncate">{b.batchName}</div>
                            <div className="text-gray-500 text-xs mt-0.5 truncate">
                              {b.activityName} • {b.entityName}
                            </div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                      </label>
                    );
                  })}
                  {batches.length === 0 && (
                    <div className="text-sm text-gray-400 text-center py-8 border border-dashed border-gray-200 rounded-lg">
                      No other batches found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pagination (fixed) */}
            {batches.length > 0 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 transition-colors duration-150 hover:border-primary/40 hover:text-primary disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>
                <span className="text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 transition-colors duration-150 hover:border-primary/40 hover:text-primary disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Sticky action bar */}
        <div className={`${!selectedBatchId || submitting || members.length === 0 ? 'hidden' : 'sticky'}  bottom-4`}>
          <button
            disabled={!selectedBatchId || submitting || members.length === 0}
            onClick={handleReassign}
            className={`w-full sm:w-auto px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium shadow-md transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed`}
          >
            {submitting ? "Reassigning…" : `Assign ${members.length} member(s) to selected batch`}
          </button>
        </div>
      </div>
    </div>
  );
}