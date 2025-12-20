"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Building2, Users, User, CreditCard, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
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

export default function FamilyPanel({
  selectedEntityId,
  selectedAccountId,
  selectedMemberId,
  selectedMembershipId,
  entityOptions,
  accountOptions,
  memberOptions,
  membershipOptions,
  onEntityChange,
  onAccountChange,
  onMemberChange,
  onMembershipChange,
}: FamilyPanelProps) {

  const SearchableSelect = ({
    label, icon: Icon, value, options, onChange, placeholder, disabled
  }: any) => {
    const [open, setOpen] = React.useState(false);

    return (
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2 ml-1">
          <Icon className="h-3.5 w-3.5" /> {label}
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              disabled={disabled}
              className={cn(
                "w-full justify-between bg-background/50 border-border/60 font-normal hover:border-primary/50 transition-all",
                !value && "text-muted-foreground"
              )}
            >
              <span className="truncate">
                {value
                  ? options.find((opt: any) => opt.id === value)?.name
                  : placeholder}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder={`Search ${label.toLowerCase()}...`} className="h-9" />
              <CommandList className="max-h-[250px]">
                <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      onChange(null);
                      setOpen(false);
                    }}
                    className="text-muted-foreground italic text-xs"
                  >
                    Clear Selection
                  </CommandItem>
                  {options.map((opt: any) => (
                    <CommandItem
                      key={opt.id}
                      value={opt.name}
                      onSelect={() => {
                        onChange(opt.id);
                        setOpen(false);
                      }}
                      className="text-sm"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 text-primary",
                          value === opt.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {opt.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const RenderSelect = ({
    label, icon: Icon, value, options, onChange, disabled, placeholder
  }: any) => (
    <div className="space-y-2">
      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2 ml-1">
        <Icon className="h-3.5 w-3.5" /> {label}
      </Label>
      <Select
        value={value?.toString()}
        onValueChange={(val) => onChange(val === "none" ? null : Number(val))}
        disabled={disabled}
      >
        <SelectTrigger className="w-full bg-background/50 border-border/60 hover:border-primary/50 transition-all">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" className="text-muted-foreground italic text-xs">Clear Selection</SelectItem>
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
    <div className="flex flex-col h-full bg-card/30 backdrop-blur-sm p-5 border-r border-border/40 overflow-y-auto">
      <div className="mb-8 shrink-0">
        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <Users className="h-4 w-4" />
          </div>
          Hierarchy Config
        </h2>
        <p className="text-[11px] text-muted-foreground mt-1 ml-10">Start by selecting a member</p>
      </div>

      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-6"
      >
        {/* 1) Member Dropdown (Now Searchable and First) */}
        <SearchableSelect
          label="Member"
          icon={User}
          value={selectedMemberId}
          options={memberOptions}
          onChange={(id: number | null) => {
            onMemberChange(id);
            // Parent logic should ideally handle cascading resets
          }}
          placeholder="Search 1000+ members..."
          disabled={false}
        />

        <div className="h-[1px] w-full bg-border/40 my-1" />

        {/* 2) Membership (Enabled after Member) */}
        <RenderSelect
          label="Membership"
          icon={CreditCard}
          value={selectedMembershipId}
          options={membershipOptions}
          onChange={onMembershipChange}
          disabled={!selectedMemberId}
          placeholder={selectedMemberId ? "Select Membership" : "Select Member first"}
        />

        {/* 3) Entity (Enabled after Member) */}
        <SearchableSelect
          label="Entity"
          icon={Building2}
          value={selectedEntityId}
          options={entityOptions}
          onChange={onEntityChange}
          placeholder={selectedMemberId ? "Search entity..." : "Select Member first"}
          disabled={!selectedMemberId}
        />

        {/* 4) Account (Enabled after Member) */}
        <RenderSelect
          label="Account"
          icon={Users}
          value={selectedAccountId}
          options={accountOptions}
          onChange={onAccountChange}
          disabled={!selectedMemberId}
          placeholder={selectedMemberId ? "Select Account" : "Select Member first"}
        />
      </motion.div>
    </div>
  );
}