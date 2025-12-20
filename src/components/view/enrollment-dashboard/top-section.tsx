"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { GripVertical, User2, Loader2 } from "lucide-react";

// Types
import type { Member } from "@/types/member";
import type { Batch } from "@/types/batch";
import type { membership } from "@/types/membership";
import type { Entity } from "@/types/entity";
import type { Account } from "@/types/account";
import type { Response } from "@/types/response";
import type { AccountMember } from "@/types/accountMember";

import FamilyPanel from "./panel/family-panel";
import EnrollmentPanel from "./panel/enrollment-panel";
import BatchDetailsPanel from "./panel/batch-details-panel";

import { getEntities } from "@/api/entity.api";
import { getMemberById, getMembers } from "@/api/member.api";
import { getMemberships } from "@/api/membership.api";
import { toast } from "@/hooks/use-toast";
import { getAccounts } from "@/api/account.api";

interface TopSectionProps {
  selectedEntityId: number | null;
  selectedAccountId: number | null;
  selectedMemberId: number | null;
  selectedMembershipId: number | null;
  selectedBatch: number | null;
  memberDetails: Member | null;

  // Selection Handlers
  onEntitySelect: (id: number | null) => void;
  onAccountSelect: (id: number | null) => void;
  onMemberSelect: (id: number | null) => void;
  onMembershipSelect: (id: number | null) => void;
  onBatchSelect: (batch: Batch | null) => void;
  onMemberDetailsChange: (member: Member | null) => void;
}

export default function TopSection({
  selectedEntityId,
  selectedAccountId,
  selectedMemberId,
  selectedMembershipId,
  selectedBatch,
  memberDetails,
  onEntitySelect,
  onAccountSelect,
  onMemberSelect,
  onMembershipSelect,
  onBatchSelect,
  onMemberDetailsChange,
}: TopSectionProps) {
  // --- Layout State ---
  const [leftWidth, setLeftWidth] = useState(27);
  const [rightWidth, setRightWidth] = useState(27);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(true);

  // --- Data State ---
  const [entities, setEntities] = useState<Entity[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [members, setMembers] = useState<AccountMember[]>([]);
  const [memberships, setMemberships] = useState<membership[]>([]);
  const [loadingMember, setLoadingMember] = useState(false);

  const middleWidth = 100 - leftWidth - rightWidth;
  const memberName = memberDetails
    ? `${memberDetails.memberFirstName ?? ""} ${memberDetails.memberLastName ?? ""}`.trim()
    : "";

  // 1. INITIAL LOAD: Fetch All Members (Searchable) and Entities
  useEffect(() => {
    // Load first 2000 members for the searchable combobox
    getMembers({ limit: 2000 }).then((res: any) => {
      const data = res?.data ?? res ?? [];
      setMembers(data);
    }).catch(() => toast({ title: "Error", description: "Failed to load members", variant: "destructive" }));

    // Load Entities
    getEntities().then((res: Response<Entity[]>) => {
      if (res.success) setEntities(res.data || []);
    });
  }, []);

  // 2. MEMBER SELECTION: When a member is selected, fetch their details and memberships
  useEffect(() => {
    if (!selectedMemberId) {
      onMemberDetailsChange(null);
      setMemberships([]);
      return;
    }

    setLoadingMember(true);

    // Fetch individual member details
    getMemberById(selectedMemberId)
      .then((res: any) => {
        const detail = res?.data ?? res;
        onMemberDetailsChange(detail);

        // If the member has an account already linked, fetch that account's specific data
        if (detail.accountId || detail.familyId) {
          const accId = detail.accountId ?? detail.familyId;
          onAccountSelect(accId);
        }
      })
      .catch(() => toast({ title: "Error", description: "Failed to fetch member details", variant: "destructive" }))
      .finally(() => setLoadingMember(false));

    // Fetch available memberships for this member
    getMemberships({ memberId: selectedMemberId }).then((res: any) => {
      setMemberships(res?.data ?? res ?? []);
    });
  }, [selectedMemberId]);

  // 3. ENTITY SELECTION: Fetch accounts for the selected entity
  useEffect(() => {
    if (!selectedEntityId) {
      setAccounts([]);
      return;
    }
    getAccounts({ entityId: selectedEntityId }).then((res: any) => {
      setAccounts(res?.data ?? res ?? []);
    });
  }, [selectedEntityId]);

  // --- Option Mapping for the Searchable Dropdowns ---
  const memberOptions = useMemo(() =>
    members.map(m => ({
      id: (m as any).memberId ?? (m as any).id,
      name: `${(m as any).memberFirstName ?? ""} ${(m as any).memberLastName ?? ""}`.trim() || `ID: ${(m as any).memberId}`
    })), [members]);

  const entitiesOptions = useMemo(() =>
    entities.map(e => ({ id: (e as any).entityId, name: e.entityName })), [entities]);

  const accountOptions = useMemo(() =>
    accounts.map(a => ({ id: a.accountId ?? (a as any).familyId, name: a.name || `Account #${a.accountId}` })), [accounts]);

  const membershipOptions = useMemo(() =>
    memberships.map(ms => ({
      id: ms.membershipId,
      name: `${ms.membershipId} - ${ms.status}`
    })), [memberships]);

  // --- Resize & Media Query Logic ---
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isLargeScreen) return;
    const container = e.currentTarget as HTMLDivElement;
    const rect = container.getBoundingClientRect();
    if (isDraggingLeft) {
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth > 15 && newWidth < 40 && newWidth + rightWidth < 80) setLeftWidth(newWidth);
    }
    if (isDraggingRight) {
      const newWidth = ((rect.right - e.clientX) / rect.width) * 100;
      if (newWidth > 15 && newWidth < 40 && leftWidth + newWidth < 80) setRightWidth(newWidth);
    }
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateScreenSize = () => setIsLargeScreen(mediaQuery.matches);
    updateScreenSize();
    mediaQuery.addEventListener("change", updateScreenSize);
    return () => mediaQuery.removeEventListener("change", updateScreenSize);
  }, []);

  return (
    <div
      className="flex flex-col lg:flex-row w-full h-full overflow-hidden relative"
      onMouseMove={handleMouseMove}
      onMouseUp={() => { setIsDraggingLeft(false); setIsDraggingRight(false); }}
      onMouseLeave={() => { setIsDraggingLeft(false); setIsDraggingRight(false); }}
    >
      {/* LEFT: Hierarchy Selection Panel */}
      <motion.div
        style={isLargeScreen ? { width: `${leftWidth}%` } : { width: "100%" }}
        className="lg:border-r border-border/50 overflow-hidden bg-card/20 backdrop-blur-sm"
      >
        <FamilyPanel
          selectedEntityId={selectedEntityId}
          selectedAccountId={selectedAccountId}
          selectedMemberId={selectedMemberId}
          selectedMembershipId={selectedMembershipId}
          entityOptions={entitiesOptions}
          accountOptions={accountOptions}
          memberOptions={memberOptions}
          membershipOptions={membershipOptions}
          onEntityChange={onEntitySelect}
          onAccountChange={onAccountSelect}
          onMemberChange={onMemberSelect}
          onMembershipChange={onMembershipSelect}
        />
      </motion.div>

      {/* DRAG HANDLE LEFT */}
      {isLargeScreen && (
        <div
          onMouseDown={() => setIsDraggingLeft(true)}
          className="w-1 cursor-col-resize hover:bg-primary/30 transition-colors flex items-center justify-center z-10"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/30" />
        </div>
      )}

      {/* MIDDLE: Enrollment Panel & Member Status */}
      <motion.div
        style={isLargeScreen ? { width: `${middleWidth}%` } : { width: "100%" }}
        className="overflow-hidden bg-muted/5"
      >
        {loadingMember ? (
          <div className="h-full flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-4">
              Fetching Member Record
            </p>
          </div>
        ) : selectedMemberId ? (
          <EnrollmentPanel
            selectedMemberId={selectedMemberId}
            memberName={memberName}
            memberDetails={memberDetails}
            onBatchSelect={onBatchSelect}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-60 grayscale">
            <User2 className="h-16 w-16 mb-4 text-muted-foreground/20" />
            <h3 className="text-sm font-semibold text-foreground">No Member Selected</h3>
            <p className="text-xs text-muted-foreground">Select a member from the left configuration panel</p>
          </div>
        )}
      </motion.div>

      {/* DRAG HANDLE RIGHT */}
      {isLargeScreen && (
        <div
          onMouseDown={() => setIsDraggingRight(true)}
          className="w-1 cursor-col-resize hover:bg-primary/30 transition-colors flex items-center justify-center z-10"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/30" />
        </div>
      )}

      {/* RIGHT: Batch Selection & Context */}
      <motion.div
        style={isLargeScreen ? { width: `${rightWidth}%` } : { width: "100%" }}
        className="lg:border-l border-border/50 overflow-hidden bg-background"
      >
        <BatchDetailsPanel selectedBatch={selectedBatch} />
      </motion.div>
    </div>
  );
}