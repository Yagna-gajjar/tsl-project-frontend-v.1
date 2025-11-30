import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Family } from "@/types/family";
import type { Member } from "@/types/member";
import type { Batch } from "@/types/batch";
import { getFamilies, getFamilyById } from "@/api/family.api";
import { getMembers, getMemberById } from "@/api/member.api";
import { getBatch, getBatchById } from "@/api/batch.api";

/**
 * EnrollmentDashborad
 * - Keeps your original layout & sizes
 * - Makes each pane scrollable (overflow-auto)
 * - Fetches families -> members -> member details -> batch details (if available)
 *
 * Note: adjust imports if your project paths differ.
 */
export default function EnrollmentDashborad() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [memberDetails, setMemberDetails] = useState<Member | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  const [loadingFamilies, setLoadingFamilies] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingMemberDetails, setLoadingMemberDetails] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Fetch families on mount
  useEffect(() => {
    let mounted = true;
    setLoadingFamilies(true);
    getFamilies({ limit: 100 }) // fetch a decent number; change limit as needed
      .then((res: any) => {
        if (!mounted) return;
        // API might wrap results; attempt common shapes
        const data: Family[] = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : res?.families ?? [];
        setFamilies(data);
      })
      .catch((err) => {
        console.error("getFamilies error", err);
        setError("Failed to load families");
      })
      .finally(() => mounted && setLoadingFamilies(false));
    return () => {
      mounted = false;
    };
  }, []);

  // When family selected, fetch members for that family
  useEffect(() => {
    if (!selectedFamilyId) {
      setMembers([]);
      setSelectedMemberId(null);
      setMemberDetails(null);
      return;
    }

    let mounted = true;
    setLoadingMembers(true);
    getMembers({ familyId: selectedFamilyId, limit: 200 })
      .then((res: any) => {
        if (!mounted) return;
        const data: Member[] = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : res?.members ?? [];
        setMembers(data);
      })
      .catch((err) => {
        console.error("getMembers error", err);
        setError("Failed to load members for selected family");
      })
      .finally(() => mounted && setLoadingMembers(false));

    return () => {
      mounted = false;
    };
  }, [selectedFamilyId]);

  // When a member is selected, fetch detailed member data and batches
  useEffect(() => {
    if (!selectedMemberId) {
      setMemberDetails(null);
      setSelectedBatch(null);
      return;
    }

    let mounted = true;
    setLoadingMemberDetails(true);
    setLoadingBatches(true);

    // fetch member details
    getMemberById(selectedMemberId)
      .then((res: any) => {
        if (!mounted) return;
        // again accommodate different response shapes
        const data: Member = res?.data ?? res;
        setMemberDetails(data);
      })
      .catch((err) => {
        console.error("getMemberById error", err);
        setError("Failed to load member details");
      })
      .finally(() => mounted && setLoadingMemberDetails(false));

    // fetch batches (we'll match by batchId if member has one)
    getBatch({ limit: 200 })
      .then((res: any) => {
        if (!mounted) return;
        const data: Batch[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : res?.batches ?? [];
        setBatches(data);

        // if member has enrollment info and batchId, select that batch
        // (defensive: check nested shapes)
        const batchId =
          // common places that enrollment/batchId might be stored
          (memberDetails as any)?.enrollment?.batchId ??
          (memberDetails as any)?.currentEnrollment?.batchId ??
          (memberDetails as any)?.batchId ??
          undefined;

        if (batchId) {
          const found = data.find(
            (b) => (b as any).batchId === batchId || (b as any).id === batchId
          );
          if (found) setSelectedBatch(found);
        }
      })
      .catch((err) => {
        console.error("getBatch error", err);
        setError("Failed to load batches");
      })
      .finally(() => mounted && setLoadingBatches(false));

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMemberId]); // intentionally only depends on selectedMemberId

  // helper: show family preview when clicked in dropdown list
  const onFamilySelect = useCallback((id?: number) => {
    setSelectedFamilyId(id ?? null);
    setSelectedMemberId(null);
    setMemberDetails(null);
  }, []);

  const onMemberSelect = useCallback((id?: number) => {
    setSelectedMemberId(id ?? null);
    setSelectedBatch(null);
  }, []);

  // attempt to get a readable display name for a member
  const memberDisplay = (m: Member) => {
    const first = (m as any).memberFirstName ?? (m as any).firstName ?? "";
    const last = (m as any).memberLastName ?? (m as any).lastName ?? "";
    return (
      `${first} ${last}`.trim() ||
      `#${(m as any).memberId ?? (m as any).id ?? "Unknown"}`
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="h-screen">
        <div className="h-3/5 flex">
          {/* LEFT: Family select dropdown, fetch family Names */}
          <div className="w-1/5 border-r border-gray-200 p-3">
            <div className="h-full flex flex-col">
              <div className="mb-3">
                <label className="block text-sm font-medium">Families</label>
                <select
                  value={selectedFamilyId ?? ""}
                  onChange={(e) =>
                    onFamilySelect(
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="mt-1 block w-full rounded-md border px-2 py-1 text-sm"
                >
                  <option value="">-- Select family --</option>
                  {families.map((f: any) => (
                    <option
                      key={(f as any).familyId ?? f.id}
                      value={(f as any).familyId ?? f.id}
                    >
                      {(f as any).familyName ??
                        `${(f as any).familyId ?? f.id}`}
                    </option>
                  ))}
                </select>
                {loadingFamilies && (
                  <div className="text-xs mt-2">Loading families...</div>
                )}
                {error && (
                  <div className="text-xs text-red-500 mt-2">{error}</div>
                )}
              </div>

              {/* list of members belonging to selected family */}
              <div className="flex-1 min-h-0">
                <div className="text-sm font-medium mb-2">Members</div>
                <div className="h-full overflow-auto rounded bg-white/5 p-1">
                  {loadingMembers ? (
                    <div className="text-sm p-2">Loading members...</div>
                  ) : members.length === 0 ? (
                    <div className="text-sm p-2 text-slate-400">No members</div>
                  ) : (
                    <ul className="space-y-1">
                      {members.map((m) => (
                        <li
                          key={(m as any).memberId ?? (m as any).id}
                          onClick={() =>
                            onMemberSelect((m as any).memberId ?? (m as any).id)
                          }
                          className={`cursor-pointer rounded px-2 py-1 text-sm hover:bg-slate-100 ${
                            selectedMemberId ===
                            ((m as any).memberId ?? (m as any).id)
                              ? "bg-slate-200"
                              : ""
                          }`}
                        >
                          {memberDisplay(m)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE: Enrollment form area */}
          <div className="w-3/5 p-3">
            <div className="h-full flex flex-col min-h-0">
              <div className="text-lg font-semibold mb-2">Enrollment Form</div>

              {/* make this inner area scrollable */}
              <div className="flex-1 overflow-auto rounded bg-white/5 p-4 min-h-0">
                {selectedMemberId ? (
                  <>
                    {loadingMemberDetails ? (
                      <div>Loading member details...</div>
                    ) : memberDetails ? (
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm text-slate-500">
                            Selected Member
                          </div>
                          <div className="text-base font-medium">
                            {memberDisplay(memberDetails)}
                          </div>
                          <div className="text-sm text-slate-500">
                            Mobile:{" "}
                            {(memberDetails as any).mobile ??
                              (memberDetails as any).phone ??
                              "N/A"}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-slate-500">
                            Basic Info
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <div>
                              Gender: {(memberDetails as any).gender ?? "N/A"}
                            </div>
                            <div>
                              Age: {(memberDetails as any).age ?? "N/A"}
                            </div>
                            <div>
                              City: {(memberDetails as any).city ?? "N/A"}
                            </div>
                            <div>
                              Email: {(memberDetails as any).email ?? "N/A"}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-slate-500">
                            Enrollment
                          </div>
                          <div className="mt-2">
                            {/* If your member object contains an enrollment object or a batchId, show it */}
                            {(memberDetails as any).enrollment ||
                            (memberDetails as any).currentEnrollment ? (
                              <>
                                <div className="text-sm">
                                  Enrollment details available — show fields as
                                  required (example below)
                                </div>
                                <div className="mt-1 text-sm">
                                  Batch id:{" "}
                                  {(memberDetails as any).enrollment?.batchId ??
                                    (memberDetails as any).currentEnrollment
                                      ?.batchId ??
                                    "N/A"}
                                </div>
                                <div className="mt-1 text-sm">
                                  Status:{" "}
                                  {(memberDetails as any).enrollment?.status ??
                                    "N/A"}
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-slate-400">
                                No enrollment found for this member
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-slate-500">
                            Assign / Change Batch
                          </div>
                          <div className="mt-2">
                            {loadingBatches ? (
                              <div>Loading batches...</div>
                            ) : batches.length === 0 ? (
                              <div className="text-sm text-slate-400">
                                No batches
                              </div>
                            ) : (
                              <select
                                value={
                                  (selectedBatch as any)?.batchId ??
                                  (selectedBatch as any)?.id ??
                                  ""
                                }
                                onChange={(e) => {
                                  const id = e.target.value
                                    ? Number(e.target.value)
                                    : undefined;
                                  const found = batches.find(
                                    (b) =>
                                      (b as any).batchId === id ||
                                      (b as any).id === id
                                  );
                                  setSelectedBatch(found ?? null);
                                }}
                                className="rounded border px-2 py-1 text-sm"
                              >
                                <option value="">-- Select batch --</option>
                                {batches.map((b) => (
                                  <option
                                    key={(b as any).batchId ?? (b as any).id}
                                    value={(b as any).batchId ?? (b as any).id}
                                  >
                                    {(b as any).batchName ??
                                      (b as any).name ??
                                      `Batch ${
                                        (b as any).batchId ?? (b as any).id
                                      }`}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          {/* show selected batch details */}
                          {selectedBatch && (
                            <div className="mt-3 border-t pt-3 text-sm">
                              <div className="font-medium">
                                {(selectedBatch as any).batchName ??
                                  (selectedBatch as any).name}
                              </div>
                              <div>
                                Coach:{" "}
                                {(selectedBatch as any).coachFirstName ?? "N/A"}
                              </div>
                              <div>
                                Facility:{" "}
                                {(selectedBatch as any).facilityName ?? "N/A"}
                              </div>
                              <div>
                                Course:{" "}
                                {(selectedBatch as any).courseName ?? "N/A"}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* TODO: enrollment form fields, create/update calls */}
                        <div>
                          <button className="rounded px-3 py-1 border text-sm">
                            Open enrollment editor
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">
                        Member details not available
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-slate-400">
                    Select a member to view enrollment form
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Batch details */}
          <div className="w-1/5 border-l border-gray-200 p-3">
            <div className="h-full flex flex-col min-h-0">
              <div className="text-sm font-medium mb-2">Batch Details</div>

              <div className="flex-1 overflow-auto rounded bg-white/5 p-2 min-h-0">
                {selectedBatch ? (
                  <div className="space-y-2 text-sm">
                    <div className="font-medium">
                      {(selectedBatch as any).batchName ??
                        (selectedBatch as any).name}
                    </div>
                    <div>
                      Batch id:{" "}
                      {(selectedBatch as any).batchId ??
                        (selectedBatch as any).id}
                    </div>
                    <div>
                      Coach: {(selectedBatch as any).coachFirstName ?? "N/A"}
                    </div>
                    <div>
                      Course: {(selectedBatch as any).courseName ?? "N/A"}
                    </div>
                    <div>
                      Facility: {(selectedBatch as any).facilityName ?? "N/A"}
                    </div>
                    <div>
                      Schedule: {(selectedBatch as any).schedule ?? "N/A"}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-slate-400">
                      No batch selected
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Tip: select a member or choose a batch from the middle
                      pane
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM: member history */}
        <div className="h-2/5 w-screen bg-green-900 p-3">
          <div className="h-full flex flex-col min-h-0">
            <div className="text-sm font-medium text-white mb-2">
              Member History / Billing (placeholder)
            </div>
            <div className="flex-1 overflow-auto rounded bg-white/5 p-3 min-h-0">
              {selectedMemberId ? (
                <>
                  <div className="text-sm mb-2">
                    Activity history and billing for{" "}
                    {memberDetails
                      ? memberDisplay(memberDetails)
                      : `#${selectedMemberId}`}
                  </div>

                  {/* Example: show some fields if memberDetails has history array */}
                  {(memberDetails as any)?.history ? (
                    <ul className="space-y-2 text-sm">
                      {((memberDetails as any).history as any[]).map((h, i) => (
                        <li key={i} className="p-2 bg-white/10 rounded">
                          <div>{h.title ?? h.action ?? JSON.stringify(h)}</div>
                          <div className="text-xs text-slate-300">
                            {h.date ?? h.time ?? ""}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-slate-300">
                      No history available. Billing section will be implemented
                      later.
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-slate-200">
                  Select a member to view history and billing.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
