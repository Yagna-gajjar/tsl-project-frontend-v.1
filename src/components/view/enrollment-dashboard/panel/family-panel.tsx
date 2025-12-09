"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Import AnimatePresence
import {
  Users,
  User,
  AlertCircle,
  Loader2,
  X,
  IndianRupee,
  Wallet, // Added Wallet icon for a visual touch in the button
} from "lucide-react";
import type { Family } from "@/types/family";
import type { Member } from "@/types/member";
import type { membership } from "@/types/membership";
import { getFamilies } from "@/api/family.api";
import { getMembers, getMemberById } from "@/api/member.api";
import { getMemberships } from "@/api/membership.api"; // adjust path if needed
import SearchInput from "../search-input";

interface FamilyPanelProps {
  selectedFamilyId: number | null;
  selectedMemberId: number | null;
  memberName: string | null;
  onFamilySelect: (id: number | null) => void;
  onMemberSelect: (id: number | null) => void;
  onMemberDetailsChange: (member: Member | null) => void;
}

export default function FamilyPanel({
  selectedFamilyId,
  selectedMemberId,
  onFamilySelect,
  onMemberSelect,
  onMemberDetailsChange,
}: FamilyPanelProps) {
  const [families, setFamilies] = useState<Family[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [familySearch, setFamilySearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [loadingFamilies, setLoadingFamilies] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loadingMemberships, setLoadingMemberships] = useState(false);
  const [membershipBalance, setMembershipBalance] = useState<number | null>(
    null
  );
  const [selectedMembership, setSelectedMembership] =
    useState<membership | null>(null);
  const [membershipList, setMembershipList] = useState<membership[]>([]);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  // State to track if the family has memberships to conditionally style the button
  const [hasMemberships, setHasMemberships] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoadingFamilies(true);
    getFamilies({ limit: 100 })
      .then((res: any) => {
        if (!mounted) return;
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

  useEffect(() => {
    if (!selectedFamilyId) {
      setMembers([]);
      onMemberSelect(null);
      onMemberDetailsChange(null);
      // Reset membership related states
      setMembershipList([]);
      setMembershipBalance(null);
      setHasMemberships(false);
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
        setError("Failed to load members");
      })
      .finally(() => mounted && setLoadingMembers(false));

    // Reset membership related states when family changes
    setMembershipList([]);
    setMembershipBalance(null);
    setHasMemberships(false);

    return () => {
      mounted = false;
    };
  }, [selectedFamilyId, onMemberSelect, onMemberDetailsChange]);

  // Fetch member details when selected
  useEffect(() => {
    if (!selectedMemberId) {
      onMemberDetailsChange(null);
      return;
    }

    let mounted = true;
    getMemberById(selectedMemberId)
      .then((res: any) => {
        if (!mounted) return;
        const data: Member = res?.data ?? res;
        onMemberDetailsChange(data);
      })
      .catch((err) => {
        console.error("getMemberById error", err);
        setError("Failed to load member details");
      });

    return () => {
      mounted = false;
    };
  }, [selectedMemberId, onMemberDetailsChange]);

  const memberDisplay = (m: Member) => {
    const first = (m as any).memberFirstName ?? (m as any).firstName ?? "";
    const last = (m as any).memberLastName ?? (m as any).lastName ?? "";
    return (
      `${first} ${last}`.trim() ||
      `#${(m as any).memberId ?? (m as any).id ?? "Unknown"}`
    );
  };

  // Updated filtering logic to include email and emergency contact
  const filteredFamilies = families.filter((f: any) => {
    const query = familySearch.toLowerCase();

    // Check Family Name or ID
    const nameMatch = (
      (f as any).familyName ?? `${(f as any).familyId ?? f.id}`
    )
      .toLowerCase()
      .includes(query);

    // Check Email (checks common fields: email, familyEmail)
    const emailMatch = ((f as any).email ?? (f as any).familyEmail ?? "")
      .toLowerCase()
      .includes(query);

    // Check Emergency Contact (checks common fields: emergencyContact, phone, contactNumber)
    const contactMatch = (
      (f as any).emergencyContact ??
      (f as any).contactNumber ??
      (f as any).phone ??
      ""
    )
      .toLowerCase()
      .includes(query);

    return nameMatch || emailMatch || contactMatch;
  });

  const filteredMembers = members.filter((m) =>
    memberDisplay(m).toLowerCase().includes(memberSearch.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  // close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        // don't clear search, just close dropdown by blurring input (consumer can still edit)
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const showFilteredFamilies =
    familySearch.trim().length > 0 && filteredFamilies.length > 0;

  // Fetch memberships and compute balance (on demand)
  const fetchMembershipBalance = async (familyId: number) => {
    try {
      setLoadingMemberships(true);
      setMembershipBalance(null);
      setSelectedMembership(null);
      setMembershipList([]);
      setHasMemberships(false); // Reset before fetch

      // fetch memberships for this family (you exposed getMemberships in api.ts)
      const res: any = await getMemberships({ familyId, limit: 100 });
      const rows: membership[] = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : res ?? [];

      setMembershipList(rows);
      setHasMemberships(rows.length > 0); // Set hasMemberships

      // pick active membership first, otherwise the latest by membershipId
      const active = rows.find(
        (r) => String(r.status).toLowerCase() === "active"
      );
      const chosen =
        active ??
        rows.sort((a, b) => (b.membershipId ?? 0) - (a.membershipId ?? 0))[0];

      if (!chosen) {
        setMembershipBalance(0);
        setSelectedMembership(null);
      } else {
        // compute balance: actualFBalance + actualCBalance (change if you prefer other formula)
        const f = Number(chosen.actualFBalance ?? 0);
        const c = Number(chosen.actualCBalance ?? 0);
        const total = f + c;
        setMembershipBalance(total);
        setSelectedMembership(chosen);
      }

      setShowBalanceModal(true);
    } catch (err) {
      console.error("getMemberships error", err);
      setError("Failed to load membership(s) for this family");
    } finally {
      setLoadingMemberships(false);
    }
  };

  const buttonClass = hasMemberships
    ? "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-yellow-500 bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 transition-colors duration-200 shadow-md shadow-yellow-500/20"
    : "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border/40 bg-card hover:bg-accent/50 transition-colors duration-200";

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border/50 p-4 bg-gradient-to-r from-primary/5 to-transparent"
      >
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg bg-primary/10"
          >
            <Users className="h-5 w-5 text-primary" />
          </motion.div>
          <h2 className="text-base font-semibold text-foreground">
            Family & Members
          </h2>
        </div>

        <div className="mb-3 relative" ref={dropdownRef}>
          <label className="block text-xs font-medium text-foreground mb-2">
            Families
          </label>
          <SearchInput
            value={familySearch}
            onChange={setFamilySearch}
            placeholder="Search by name, email, or phone..."
          />

          {/* Friendly filtered list UI — only show when user typed something */}
          {showFilteredFamilies && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-2 max-h-48 overflow-y-auto rounded-lg shadow-lg border border-border/40 bg-card z-50"
            >
              <ul role="list" className="divide-y divide-border/30">
                {filteredFamilies.map((f: any) => {
                  const id = (f as any).familyId ?? f.id;
                  const name = (f as any).familyName ?? `${id}`;
                  return (
                    <li
                      key={id}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent/40 transition-colors flex items-center gap-2 ${
                        selectedFamilyId === id
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-foreground"
                      }`}
                      onClick={() => {
                        onFamilySelect(id);
                        // clear member search and selection when family changes
                        setMemberSearch("");
                        onMemberSelect(null);
                        onMemberDetailsChange(null);
                        // keep the typed query — user still sees what they searched for
                      }}
                    >
                      <Users className="h-4 w-4 flex-shrink-0 text-muted-foreground/60" />
                      <div className="truncate">{name}</div>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}

          {/* helpful empty state when user typed but nothing matched */}
          {familySearch.trim().length > 0 && filteredFamilies.length === 0 && (
            <div className="mt-2 rounded-lg p-3 text-xs text-muted-foreground border border-border/30 bg-card/50">
              No families match "{familySearch}".
            </div>
          )}
        </div>

        {/* Error / Loading */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-destructive mt-2"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </motion.div>
        )}

        {loadingFamilies && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading families...
          </div>
        )}

        {/* Balance button when a family is selected */}
        {selectedFamilyId && (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchMembershipBalance(selectedFamilyId)}
              className={buttonClass}
              disabled={loadingMemberships}
            >
              {loadingMemberships ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : hasMemberships ? (
                <Wallet className="h-4 w-4" />
              ) : (
                <IndianRupee className="h-4 w-4" />
              )}
              <span className="text-sm">Balance</span>
            </button>

            {/* quick visual if already fetched */}
            {loadingMemberships ? (
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Fetching...
              </div>
            ) : membershipBalance !== null ? (
              <div
                className={`text-sm ${
                  hasMemberships
                    ? "text-yellow-600 font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                ₹ {membershipBalance.toFixed(2)}
              </div>
            ) : null}
          </div>
        )}
      </motion.div>

      <div className="flex-1 flex flex-col min-h-0 p-4 overflow-hidden">
        <div className="mb-3">
          <label className="block text-xs font-medium text-foreground mb-2">
            Members
          </label>
          <SearchInput
            value={memberSearch}
            onChange={setMemberSearch}
            placeholder="Search members..."
            disabled={!selectedFamilyId}
          />
        </div>

        <motion.div
          className="flex-1 rounded-lg border border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {loadingMembers ? (
            <div className="flex items-center justify-center h-full gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Loading members...
              </span>
            </div>
          ) : !selectedFamilyId ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Users className="h-8 w-8 text-muted-foreground/50" />
              <span className="text-sm text-muted-foreground">
                Select a family first
              </span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <User className="h-8 w-8 text-muted-foreground/50" />
              <span className="text-sm text-muted-foreground">
                No members found
              </span>
            </div>
          ) : (
            <ul className="divide-y divide-border/30 h-full overflow-y-auto">
              {filteredMembers.map((m) => (
                <motion.li
                  key={(m as any).memberId ?? (m as any).id}
                  variants={itemVariants}
                  whileHover={{ x: 4 }}
                  onClick={() =>
                    onMemberSelect((m as any).memberId ?? (m as any).id)
                  }
                  className={`cursor-pointer px-3 py-2.5 text-sm transition-all ${
                    selectedMemberId === ((m as any).memberId ?? (m as any).id)
                      ? "bg-primary text-primary-foreground font-medium shadow-md"
                      : "hover:bg-accent/50 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{memberDisplay(m)}</span>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>

      {/* Balance modal - Enhanced with Framer Motion and Gold Styling */}
      <AnimatePresence>
        {showBalanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowBalanceModal(false)}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative max-w-lg w-full bg-card rounded-xl shadow-2xl p-6 border border-yellow-500/30 overflow-hidden" // Enhanced style
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/50">
                <h3 className="text-lg font-bold flex items-center gap-2 text-yellow-600">
                  <Wallet className="h-5 w-5 fill-yellow-600 stroke-1" /> Family
                  Membership Balance
                </h3>
                <button
                  className="p-1 rounded-full hover:bg-red-500/20 transition-colors"
                  onClick={() => setShowBalanceModal(false)}
                >
                  <X className="h-5 w-5 text-muted-foreground hover:text-red-500" />
                </button>
              </div>

              {/* Balance Display */}
              <div className="mb-4">
                {loadingMemberships ? (
                  <div className="flex items-center gap-2 text-base text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading membership details...</span>
                  </div>
                ) : membershipBalance !== null ? (
                  <div className="flex items-end gap-2">
                    <IndianRupee className="h-6 w-6 text-yellow-600" />
                    <span className="text-4xl font-extrabold text-yellow-700 leading-none">
                      {membershipBalance.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <div className="text-base text-muted-foreground">
                    No membership balance found for this family.
                  </div>
                )}
              </div>

              {/* Membership Details */}
              <div className="text-sm text-muted-foreground mb-4 pt-2 border-t border-border/30">
                {selectedMembership ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="font-semibold text-foreground">
                      Membership ID:
                    </div>
                    <div className="text-right">
                      {selectedMembership.membershipId}
                    </div>
                    <div className="font-semibold text-foreground">Status:</div>
                    <div
                      className={`text-right font-medium ${
                        selectedMembership.status?.toLowerCase() === "active"
                          ? "text-green-500"
                          : "text-orange-500"
                      }`}
                    >
                      {selectedMembership.status}
                    </div>
                    <div className="font-semibold text-foreground">
                      Start Date:
                    </div>
                    <div className="text-right">
                      {selectedMembership.startDate
                        ? new Date(
                            selectedMembership.startDate
                          ).toLocaleDateString()
                        : "—"}
                    </div>
                    <div className="font-semibold text-foreground">
                      End Date:
                    </div>
                    <div className="text-right">
                      {selectedMembership.endDate
                        ? new Date(
                            selectedMembership.endDate
                          ).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                ) : membershipList.length > 0 ? (
                  <div>
                    <div className="mb-2 font-bold text-base text-foreground">
                      All Family Memberships
                    </div>
                    <ul className="max-h-40 overflow-y-auto divide-y divide-border/30">
                      {membershipList.map((m) => (
                        <li
                          key={m.membershipId}
                          className="py-2 flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-medium">
                              #{m.membershipId}
                            </span>{" "}
                            —{" "}
                            <span
                              className={`font-semibold ${
                                m.status?.toLowerCase() === "active"
                                  ? "text-green-500"
                                  : "text-orange-500"
                              }`}
                            >
                              {m.status}
                            </span>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {m.startDate
                                ? new Date(m.startDate).toLocaleDateString()
                                : "—"}{" "}
                              —{" "}
                              {m.endDate
                                ? new Date(m.endDate).toLocaleDateString()
                                : "—"}
                            </div>
                          </div>
                          <div className="flex items-center font-bold text-foreground">
                            <IndianRupee className="h-3 w-3 mr-0.5" />
                            {(
                              Number(m.actualFBalance ?? 0) +
                              Number(m.actualCBalance ?? 0)
                            ).toFixed(2)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div>No past or current memberships found.</div>
                )}
              </div>

              {/* Footer Button */}
              <div className="flex justify-end gap-2 pt-4 border-t border-border/30">
                <button
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors"
                  onClick={() => {
                    setShowBalanceModal(false);
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
