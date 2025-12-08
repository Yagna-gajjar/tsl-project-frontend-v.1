"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Users, User, AlertCircle, Loader2 } from "lucide-react";
import type { Family } from "@/types/family";
import type { Member } from "@/types/member";
import { getFamilies } from "@/api/family.api";
import { getMembers, getMemberById } from "@/api/member.api";
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

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoadingFamilies(true);
    // Note: Ensure emergencyContact and email are defined variables or removed if not needed for the initial fetch
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
    const nameMatch = ((f as any).familyName ?? `${(f as any).familyId ?? f.id}`)
      .toLowerCase()
      .includes(query);

    // Check Email (checks common fields: email, familyEmail)
    const emailMatch = ((f as any).email ?? (f as any).familyEmail ?? "")
      .toLowerCase()
      .includes(query);

    // Check Emergency Contact (checks common fields: emergencyContact, phone, contactNumber)
    const contactMatch = ((f as any).emergencyContact ?? (f as any).contactNumber ?? (f as any).phone ?? "")
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
              className="mt-2 max-h-48 overflow-y-auto rounded-lg shadow-lg border border-border/40 bg-card z-50"
            >
              <ul role="list" className="divide-y divide-border/30">
                {filteredFamilies.map((f: any) => {
                  const id = (f as any).familyId ?? f.id;
                  const name = (f as any).familyName ?? `${id}`;
                  return (
                    <li
                      key={id}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent/40 transition-colors flex items-center gap-2 ${selectedFamilyId === id
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
                  className={`cursor-pointer px-3 py-2.5 text-sm transition-all ${selectedMemberId === ((m as any).memberId ?? (m as any).id)
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
    </div>
  );
}