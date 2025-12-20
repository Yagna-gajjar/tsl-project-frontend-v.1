"use client";

import { motion } from "framer-motion";
import { Building2, Users, User, CreditCard } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DropdownOption {
  id: number;
  name: string;
}

interface FamilyPanelProps {
  selectedEntityId: number | null;
  selectedAccountId: number | null;
  selectedMemberId: number | null;
  selectedMembershipId: number | null;
  entityOptions: DropdownOption[];
  accountOptions: DropdownOption[];
  memberOptions: DropdownOption[];
  membershipOptions: DropdownOption[];
  onEntityChange: (id: number | null) => void;
  onAccountChange: (id: number | null) => void;
  onMemberChange: (id: number | null) => void;
  onMembershipChange: (id: number | null) => void;
}

export default function FamilyPanel(props: FamilyPanelProps) {
  const {
    selectedEntityId, selectedAccountId, selectedMemberId, selectedMembershipId,
    entityOptions, accountOptions, memberOptions, membershipOptions,
    onEntityChange, onAccountChange, onMemberChange, onMembershipChange,
  } = props;

  const RenderSelect = ({
    label, icon: Icon, value, options, onChange, disabled, placeholder
  }: any) => (
    <div className="space-y-2">
      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2 ml-1">
        <Icon className="h-3 w-3" /> {label}
      </Label>
      <Select
        value={value?.toString()}
        onValueChange={(val) => onChange(val === "none" ? null : Number(val))}
        disabled={disabled}
      >
        <SelectTrigger className="w-full bg-background/50 border-border/60 hover:border-primary/50 transition-all focus:ring-primary/20">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={"null"} className="text-muted-foreground">Clear Selection</SelectItem>
          {options.map((opt: any) => (
            <SelectItem key={opt.id} value={opt.id.toString()}>
              {opt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-card/30 backdrop-blur-sm p-5 border-r border-border/40">
      <div className="mb-8 shrink-0">
        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          Configuration
        </h2>
        <p className="text-[11px] text-muted-foreground mt-1 ml-10">Select member hierarchy</p>
      </div>

      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-6"
      >
        <RenderSelect
          label="Entity"
          icon={Building2}
          value={selectedEntityId}
          options={entityOptions}
          onChange={onEntityChange}
          placeholder="Select an Entity"
        />

        <RenderSelect
          label="Account"
          icon={Users}
          value={selectedAccountId}
          options={accountOptions}
          onChange={onAccountChange}
          disabled={!selectedEntityId}
          placeholder={selectedEntityId ? "Select Account" : "Select Entity first"}
        />

        <RenderSelect
          label="Member"
          icon={User}
          value={selectedMemberId}
          options={memberOptions}
          onChange={onMemberChange}
          disabled={!selectedAccountId}
          placeholder={selectedAccountId ? "Select Member" : "Select Account first"}
        />

        <RenderSelect
          label="Membership"
          icon={CreditCard}
          value={selectedMembershipId}
          options={membershipOptions}
          onChange={onMembershipChange}
          disabled={!selectedAccountId}
          placeholder={selectedAccountId ? "Select Membership" : "Select Account first"}
        />
      </motion.div>
    </div>
  );
}