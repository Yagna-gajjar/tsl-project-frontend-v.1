"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Users, User, AlertCircle, Loader2 } from "lucide-react"
import type { Family } from "@/types/family"
import type { Member } from "@/types/member"
import { getFamilies } from "@/api/family.api"
import { getMembers, getMemberById } from "@/api/member.api"
import SearchInput from "../search-input"

interface FamilyPanelProps {
  selectedFamilyId: number | null
  selectedMemberId: number | null
  onFamilySelect: (id: number | null) => void
  onMemberSelect: (id: number | null) => void
  onMemberDetailsChange: (member: Member | null) => void
}

export default function FamilyPanel({
  selectedFamilyId,
  selectedMemberId,
  onFamilySelect,
  onMemberSelect,
  onMemberDetailsChange,
}: FamilyPanelProps) {
  const [families, setFamilies] = useState<Family[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [familySearch, setFamilySearch] = useState("")
  const [memberSearch, setMemberSearch] = useState("")
  const [loadingFamilies, setLoadingFamilies] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch families on mount
  useEffect(() => {
    let mounted = true
    setLoadingFamilies(true)
    getFamilies({ limit: 100 })
      .then((res: any) => {
        if (!mounted) return
        const data: Family[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : (res?.families ?? [])
        setFamilies(data)
      })
      .catch((err) => {
        console.error("getFamilies error", err)
        setError("Failed to load families")
      })
      .finally(() => mounted && setLoadingFamilies(false))

    return () => {
      mounted = false
    }
  }, [])

  // When family selected, fetch members
  useEffect(() => {
    if (!selectedFamilyId) {
      setMembers([])
      onMemberSelect(null)
      onMemberDetailsChange(null)
      return
    }

    let mounted = true
    setLoadingMembers(true)
    getMembers({ familyId: selectedFamilyId, limit: 200 })
      .then((res: any) => {
        if (!mounted) return
        const data: Member[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : (res?.members ?? [])
        setMembers(data)
      })
      .catch((err) => {
        console.error("getMembers error", err)
        setError("Failed to load members")
      })
      .finally(() => mounted && setLoadingMembers(false))

    return () => {
      mounted = false
    }
  }, [selectedFamilyId, onMemberSelect, onMemberDetailsChange])

  // Fetch member details when selected
  useEffect(() => {
    if (!selectedMemberId) {
      onMemberDetailsChange(null)
      return
    }

    let mounted = true
    getMemberById(selectedMemberId)
      .then((res: any) => {
        if (!mounted) return
        const data: Member = res?.data ?? res
        onMemberDetailsChange(data)
      })
      .catch((err) => {
        console.error("getMemberById error", err)
        setError("Failed to load member details")
      })

    return () => {
      mounted = false
    }
  }, [selectedMemberId, onMemberDetailsChange])

  const memberDisplay = (m: Member) => {
    const first = (m as any).memberFirstName ?? (m as any).firstName ?? ""
    const last = (m as any).memberLastName ?? (m as any).lastName ?? ""
    return `${first} ${last}`.trim() || `#${(m as any).memberId ?? (m as any).id ?? "Unknown"}`
  }

  const filteredFamilies = families.filter((f: any) =>
    ((f as any).familyName ?? `${(f as any).familyId ?? f.id}`).toLowerCase().includes(familySearch.toLowerCase()),
  )

  const filteredMembers = members.filter((m) => memberDisplay(m).toLowerCase().includes(memberSearch.toLowerCase()))

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border/50 p-4 bg-gradient-to-r from-primary/5 to-transparent"
      >
        <div className="flex items-center gap-2 mb-4">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="p-2 rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </motion.div>
          <h2 className="text-base font-semibold text-foreground">Family & Members</h2>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-foreground mb-2">Families</label>
          <SearchInput value={familySearch} onChange={setFamilySearch} placeholder="Search families..." />
        </div>

        <select
          value={selectedFamilyId ?? ""}
          onChange={(e) => {
            onFamilySelect(e.target.value ? Number(e.target.value) : null)
            setMemberSearch("")
          }}
          className="w-full px-3 py-2.5 border border-border/60 rounded-lg bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
        >
          <option value="">-- Select family --</option>
          {filteredFamilies.map((f: any) => (
            <option key={(f as any).familyId ?? f.id} value={(f as any).familyId ?? f.id}>
              {(f as any).familyName ?? `${(f as any).familyId ?? f.id}`}
            </option>
          ))}
        </select>

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
          <label className="block text-xs font-medium text-foreground mb-2">Members</label>
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
              <span className="text-sm text-muted-foreground">Loading members...</span>
            </div>
          ) : !selectedFamilyId ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Users className="h-8 w-8 text-muted-foreground/50" />
              <span className="text-sm text-muted-foreground">Select a family first</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <User className="h-8 w-8 text-muted-foreground/50" />
              <span className="text-sm text-muted-foreground">No members found</span>
            </div>
          ) : (
            <ul className="divide-y divide-border/30 h-full overflow-y-auto">
              {filteredMembers.map((m) => (
                <motion.li
                  key={(m as any).memberId ?? (m as any).id}
                  variants={itemVariants}
                  whileHover={{ x: 4 }}
                  onClick={() => onMemberSelect((m as any).memberId ?? (m as any).id)}
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
    </div>
  )
}
