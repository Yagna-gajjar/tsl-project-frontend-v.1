"use client";

import { getMembershipMasters } from "@/api/membershipMaster.api";
import { SearchableMultiselect } from "@/components/form-modal/form-field-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import type { CourseRate } from "@/types/courseRate";
import type { MembershipMaster } from "@/types/memberShipMaster";
import type { Response } from "@/types/response";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface RatesListProps {
  rates: CourseRate[];
  onChange: (index: number, field: keyof CourseRate, value: any) => void;
  onRemove: (index: number) => void;
}

const DEFAULT_ABOVE_UNITS = [0, 6, 29, 89, 179, 364];

type BulkFields = {
  aboveUnits: string;
  enrChangesAllowed: string;
  enrFreezingAllowed: string;
  minDaysInEnr: string;
  discountOnDayReduce: string;
  unitRate: string;
};

export const RatesList = ({ rates, onChange, onRemove }: RatesListProps) => {
  /* ---------------- Membership Masters ---------------- */

  const [membershipMasterOpt, setMembershipMasterOpt] =
    useState<MembershipMaster[]>([]);
  const [membershipMasterPage, setMembershipMasterPage] = useState(1);
  const [hasMoreMembershipMaster, setHasMoreMembershipMaster] = useState(true);
  const [loadingMembershipMaster, setLoadingMembershipMaster] = useState(false);

  const PAGE_SIZE = 20;

  const fetchMembershipMaster = useCallback(async () => {
    if (loadingMembershipMaster || !hasMoreMembershipMaster) return;

    setLoadingMembershipMaster(true);
    try {
      const res: Response<MembershipMaster[]> =
        await getMembershipMasters({
          limit: PAGE_SIZE,
          page: membershipMasterPage,
        });

      const data = res?.data ?? [];
      setMembershipMasterOpt((p) => [...p, ...data]);
      setHasMoreMembershipMaster(data.length === PAGE_SIZE);
      setMembershipMasterPage((p) => p + 1);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch membership masters",
        variant: "destructive",
      });
    } finally {
      setLoadingMembershipMaster(false);
    }
  }, [loadingMembershipMaster, hasMoreMembershipMaster, membershipMasterPage]);

  useEffect(() => {
    fetchMembershipMaster();
  }, []);

  /* ---------------- Membership Selection ---------------- */

  const [selectedMembership, setSelectedMembership] = useState<number | null>(
    null
  );

  /* ---------------- Bulk (UI-only) Fields ---------------- */

  const [bulkFields, setBulkFields] = useState<BulkFields>({
    aboveUnits: "",
    enrChangesAllowed: "",
    enrFreezingAllowed: "",
    minDaysInEnr: "",
    discountOnDayReduce: "",
    unitRate: "",
  });

  // Reset bulk inputs when membership changes
  useEffect(() => {
    setBulkFields({
      aboveUnits: "",
      enrChangesAllowed: "",
      enrFreezingAllowed: "",
      minDaysInEnr: "",
      discountOnDayReduce: "",
      unitRate: "",
    });
  }, [selectedMembership]);

  /* ---------------- Helpers ---------------- */

  const membershipRates = rates
    .map((r, idx) => ({ r, idx }))
    .filter(({ r }) => r.membershipMasterId === selectedMembership);

  const isMembershipAlreadyGenerated =
    selectedMembership !== null && membershipRates.length > 0;

  const applyBulkValue = (
    field: keyof BulkFields,
    value: number
  ) => {
    membershipRates.forEach(({ idx }) => {
      onChange(idx, field as keyof CourseRate, value);
    });
  };

  /* ---------------- Generate Default Rates ---------------- */

  const addDefaultRates = () => {
    if (!selectedMembership) {
      toast({
        title: "Membership required",
        description: "Please select a Membership Master first.",
        variant: "destructive",
      });
      return;
    }

    if (isMembershipAlreadyGenerated) {
      toast({
        title: "Already generated",
        description:
          "Default rates already exist for this membership master.",
        variant: "destructive",
      });
      return;
    }

    const startIndex = rates.length;

    DEFAULT_ABOVE_UNITS.forEach((unit, i) => {
      const index = startIndex + i;

      onChange(index, "membershipMasterId", selectedMembership);
      onChange(index, "aboveUnits", unit);
      onChange(index, "enrChangesAllowed", 0);
      onChange(index, "enrFreezingAllowed", 0);
      onChange(index, "minDaysInEnr", 0);
      onChange(index, "discountOnDayReduce", 0);
      onChange(index, "unitRate", 0);
    });

    toast({
      title: "Default rates generated",
      description: "Rates added for selected membership.",
    });
  };
  
  const distinctMemberships = Array.from(
    new Map(
      rates
        .filter((r) => r.membershipMasterId != null)
        .map((r) => [r.membershipMasterId, r.membershipMasterId])
    ).values()
  );

  const [baseRates, setBaseRates] = useState<Record<number, number>>({});


  const getMembershipLabel = (id: number) =>
    membershipMasterOpt.find((m) => m.membershipMasterId === id)
      ?.membershipType ?? `Membership ${id}`;
  
      const applyPercentageDiscount = (
        baseRate: number,
        percentage: number
      ) => {
        if (percentage <= 0) return baseRate;
        return baseRate * (100 - percentage)/100;
      };
      
  

  return (
    <div className="">
      <div className="border pt-3 px-3 rounded-lg mb-3">
      {distinctMemberships.length > 0 && (
      <div className="flex flex-wrap gap-2 pb-3">
        {distinctMemberships.map((id) => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={selectedMembership === id ? "default" : "outline"}
            onClick={() => setSelectedMembership(Number(id))}
          >
            {getMembershipLabel(Number(id))}
          </Button>
        ))}
      </div>
    )}

      </div>
      <div className="flex justify-between pb-3 items-end">
      <SearchableMultiselect
        isSingle
        placeholder="Membership Master Type"
        value={selectedMembership}
        options={membershipMasterOpt.map((m) => ({
          value: Number(m.membershipMasterId),
          label: m.membershipType,
        }))}
        onChange={(v) => setSelectedMembership(v ?? null)}
      />
      
      <div className="flex justify-between items-center gap-1 px-2 py-1">
        {(
			      [
              ["enrChangesAllowed", "Enr Changes"],
              ["enrFreezingAllowed", "Enr Freezing"],
              ["minDaysInEnr", "Min Days"],
              ["discountOnDayReduce", "Discount Reduce"],
              ["unitRate", "Unit Rate"],
            ] as const
          ).map((field) => (
            <div className="flex flex-col items-center justify-center">
            <label className="text-xs">{field[1]}</label>
            <Input
              key={field}
              type="number"
              className="h-7 text-xs"
              value={bulkFields[field[0]]}
              onChange={(e) => {
                const val = e.target.value;
                setBulkFields((p) => ({ ...p, [field[0]]: val }));

                if (val !== "") {
                  applyBulkValue(field[0], Number(val));
                }
              }}
              />
              </div>
          ))}
          <div />
        </div>
        </div>

      <div className="grid grid-cols-[1.2fr,1.2fr,1.2fr,1.2fr,1.2fr,1.2fr,1.2fr,10px] gap-1 px-2 py-1 bg-muted/50 text-xs font-semibold border-b">
        <div>Above Units</div>
        <div>Enr Changes</div>
        <div>Enr Freezing</div>
        <div>Min Days</div>
        <div>Discount Reduce</div>
        <div>Unit Rate*</div>
        <div className="text-center">Action</div>
      </div>

      {!isMembershipAlreadyGenerated && (
        <div className="flex justify-center pt-5">
          <Button type="button" size="sm" onClick={addDefaultRates}>
            <Plus className="w-4 h-4 mr-1" />
            Generate Default Rates
          </Button>
        </div>
      )}
      <AnimatePresence>
        {membershipRates.map(({ r: rate, idx }) => (
          <motion.div
            key={idx}
            layout
            className="grid grid-cols-[1.2fr,1.2fr,1.2fr,1.2fr,1.2fr,1.2fr,1.2fr,10px] gap-1 px-2 py-1 border-b items-center"
          >
            <Input
              type="number"
              className="h-8 text-xs"
              value={rate.aboveUnits}
              onChange={(e) =>
                onChange(idx, "aboveUnits", Number(e.target.value))
              }
            />

            <Input
              type="number"
              className="h-8 text-xs"
              value={rate.enrChangesAllowed}
              onChange={(e) =>
                onChange(idx, "enrChangesAllowed", Number(e.target.value))
              }
            />

            <Input
              type="number"
              className="h-8 text-xs"
              value={rate.enrFreezingAllowed}
              onChange={(e) =>
                onChange(idx, "enrFreezingAllowed", Number(e.target.value))
              }
            />

            <Input
              type="number"
              className="h-8 text-xs"
              value={rate.minDaysInEnr}
              onChange={(e) =>
                onChange(idx, "minDaysInEnr", Number(e.target.value))
              }
            />

            <Input
              type="number"
              className="h-8 text-xs"
              value={rate.discountOnDayReduce}
              onChange={(e) =>
                onChange(idx, "discountOnDayReduce", Number(e.target.value))
              }
            />

            <Input
              type="number"
              className="h-8 text-xs"
              value={rate.unitRate}
              onChange={(e) =>
                onChange(idx, "unitRate", Number(e.target.value))
              }
            />
            <Input
  type="number"
  className="h-8 text-xs"
  placeholder="%"
  onChange={(e) => {
    const val = e.target.value;

    // Store base rate only once
    setBaseRates((prev) => {
      if (prev[idx] === undefined) {
        return { ...prev, [idx]: rate.unitRate };
      }
      return prev;
    });

    // If cleared → restore original rate
    if (val === "") {
      const original = baseRates[idx] ?? rate.unitRate;
      onChange(idx, "unitRate", original);
      return;
    }

    const percentage = Number(val);
    if (percentage >= 0) {
      const original = baseRates[idx] ?? rate.unitRate;
      const discounted = original * (100 - percentage) / 100;
      onChange(idx, "unitRate", Math.round(discounted));
    }
  }}
/>


            <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(idx)}
              className="h-6 w-6 p-0"
            >
              <Trash2 className="w-3 h-3" />
              </Button>
              </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
