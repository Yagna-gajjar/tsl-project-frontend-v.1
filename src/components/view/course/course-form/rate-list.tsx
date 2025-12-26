import { getMembershipMasters } from "@/api/membershipMaster.api";
import { SearchableMultiselect } from "@/components/form-modal/form-field-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import type { CourseRate } from "@/types/courseRate";
import type { MembershipMaster } from "@/types/memberShipMaster";
import type { Response } from "@/types/response";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Check } from "lucide-react";
import { useCallback, useEffect, useState, type SetStateAction } from "react";

interface RatesListProps {
  rates: CourseRate[];
  onChange: (index: number, field: keyof CourseRate, value: any) => void;
  onRemove: (index: number) => void;
  selectedMembership?: number | null,
  setSelectedMembership?: SetStateAction<number | null> 
}

const DEFAULT_ABOVE_UNITS = [0, 6, 29, 89, 179, 364];

type BulkFields = {
  enrChangesAllowed: string;
  enrFreezingAllowed: string;
  minDaysInEnr: string;
  discountOnDayReduce: string;
  baseRate: string;
  monthUnit: string;
};

export const RatesList = ({ rates, onChange, onRemove, selectedMembership, setSelectedMembership }: RatesListProps) => {
  /* ---------------- State ---------------- */
  const [membershipMasterOpt, setMembershipMasterOpt] = useState<MembershipMaster[]>([]);
  const [membershipMasterPage, setMembershipMasterPage] = useState(1);
  const [hasMoreMembershipMaster, setHasMoreMembershipMaster] = useState(true);
  const [loadingMembershipMaster, setLoadingMembershipMaster] = useState(false);
  // const [selectedMembership, setSelectedMembership] = useState<number | null>(null);

  // Added baseRate and monthUnit to bulkFields
  const [bulkFields, setBulkFields] = useState<BulkFields>({
    enrChangesAllowed: "",
    enrFreezingAllowed: "",
    minDaysInEnr: "",
    discountOnDayReduce: "",
    baseRate: "",
    monthUnit: "",
  });

  // Track individual row percentage discounts locally
  const [rowPercentages, setRowPercentages] = useState<Record<number, string>>({});
  const [baseUnitRates, setBaseUnitRates] = useState<Record<number, number>>({});


  /* ---------------- Fetching ---------------- */
  const PAGE_SIZE = 20;
  const fetchMembershipMaster = useCallback(async () => {
    if (loadingMembershipMaster || !hasMoreMembershipMaster) return;
    setLoadingMembershipMaster(true);
    try {
      const res: Response<MembershipMaster[]> = await getMembershipMasters({
        limit: PAGE_SIZE,
        page: membershipMasterPage,
      });
      const data = res?.data ?? [];
      setMembershipMasterOpt((p) => [...p, ...data]);
      setHasMoreMembershipMaster(data.length === PAGE_SIZE);
      setMembershipMasterPage((p) => p + 1);
    } catch {
      toast({ title: "Error", description: "Failed to fetch membership masters", variant: "destructive" });
    } finally {
      setLoadingMembershipMaster(false);
    }
  }, [loadingMembershipMaster, hasMoreMembershipMaster, membershipMasterPage]);

  useEffect(() => { fetchMembershipMaster(); }, []);

  /* ---------------- Logic ---------------- */
  const membershipRates = rates
    .map((r, idx) => ({ r, idx }))
    .filter(({ r }) => r.membershipMasterId === selectedMembership);

  const isMembershipAlreadyGenerated = selectedMembership !== null && membershipRates.length > 0;
  const handleApplyBulk = () => {
    if (membershipRates.length === 0) return;
  
    const bRate = parseFloat(bulkFields.baseRate);
    const mUnit = parseFloat(bulkFields.monthUnit);
  
    if (isNaN(bRate) || isNaN(mUnit) || mUnit === 0) {
      toast({ title: "Invalid Base Rate / Month Unit", variant: "destructive" });
      return;
    }
  
    membershipRates.forEach(({ idx }) => {
      if (bulkFields.enrChangesAllowed !== "")
        onChange(idx, "enrChangesAllowed", Number(bulkFields.enrChangesAllowed));
  
      if (bulkFields.enrFreezingAllowed !== "")
        onChange(idx, "enrFreezingAllowed", Number(bulkFields.enrFreezingAllowed));
  
      if (bulkFields.minDaysInEnr !== "")
        onChange(idx, "minDaysInEnr", Number(bulkFields.minDaysInEnr));
  
      if (bulkFields.discountOnDayReduce !== "")
        onChange(idx, "discountOnDayReduce", Number(bulkFields.discountOnDayReduce));
  
      const baseUnit = Math.round(bRate / mUnit);
      const discount = Number(rowPercentages[idx] || 0);
      
      setBaseUnitRates(prev => ({ ...prev, [idx]: baseUnit }));
      if (discount != 0) {
        const finalRate = Math.round(baseUnit * (discount / 100));
        onChange(idx, "unitRate", finalRate);
      } else {
        const finalRate = Math.round(baseUnit);
        onChange(idx, "unitRate", finalRate);
      }
    });
  
    toast({ title: "Applied", description: "Bulk values applied correctly." });
  };
  

  const addDefaultRates = () => {
    if (!selectedMembership) return;
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
  };

  const getMembershipLabel = (id: number) =>
    membershipMasterOpt.find((m) => m.membershipMasterId === id)?.membershipType ?? `Membership ${id}`;

  const distinctMemberships = Array.from(new Map(rates.filter((r) => r.membershipMasterId != null).map((r) => [r.membershipMasterId, r.membershipMasterId])).values());

  return (
    <div className="space-y-4">
      {distinctMemberships.length > 0 && (
        <div className="border p-2 rounded-lg flex flex-wrap gap-2">
          {distinctMemberships.map((id) => (
            <Button key={id} type="button" size="sm" variant={selectedMembership === id ? "default" : "outline"} onClick={() => setSelectedMembership(Number(id))}>
              {getMembershipLabel(Number(id))}
            </Button>
          ))}
        </div>
      )}

  
      <div className="flex flex-wrap items-end gap-3 p-3 border rounded-lg bg-card">
        
          <label className="text-xs font-medium">Select Membership</label>
          <SearchableMultiselect
            isSingle
            placeholder="Membership Master Type"
            value={selectedMembership}
            options={membershipMasterOpt.map((m) => ({ value: Number(m.membershipMasterId), label: m.membershipType }))}
            onChange={(v) => setSelectedMembership(v ?? null)}
          />
        

        <div className="grid grid-cols-4 md:grid-cols-7 items-end gap-2">
          {(["enrChangesAllowed", "enrFreezingAllowed", "minDaysInEnr", "discountOnDayReduce"] as const).map((f) => (
            <div key={f} className="flex flex-col">
              <label className="text-[10px] uppercase text-muted-foreground">{f.replace(/([A-Z])/g, ' $1')}</label>
              <Input type="number" className="h-8" value={bulkFields[f]} onChange={(e) => setBulkFields(p => ({ ...p, [f]: e.target.value }))} />
            </div>
          ))}
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-primary">Base Rate</label>
            <Input type="number" className="h-8 border-primary bg-primary/5" value={bulkFields.baseRate} onChange={(e) => setBulkFields(p => ({ ...p, baseRate: e.target.value }))} />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-primary">Month Unit</label>
            <Input type="number" className="h-8 border-primary bg-primary/5" value={bulkFields.monthUnit} onChange={(e) => setBulkFields(p => ({ ...p, monthUnit: e.target.value }))} />
          </div>
        <Button type="button" onClick={handleApplyBulk} className="h-8">
          <Check className="w-4 h-4 mr-1" /> Apply
        </Button>
        </div>

      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[.6fr,.6fr,.6fr,.6fr,.6fr,.6fr,.6fr,.8fr,50px] gap-1 px-2 py-2 bg-muted/50 text-center text-[10px] font-bold border rounded-t-md">
        <div>Above Units</div>
        <div>Enr Changes</div>
        <div>Enr Freezing</div>
        <div>Min Days</div>
        <div>Discount Red.</div>
        <div>Unit Rate</div>
        <div>Per %</div>
        <div>Rate * Units</div>
        <div></div>
      </div>

      {/* Rows */}
      <div className="border border-t-0 rounded-b-md">
        {!isMembershipAlreadyGenerated && selectedMembership && (
          <div className="p-8 flex justify-center"><Button variant="secondary" onClick={addDefaultRates}>Generate Default Rates</Button></div>
        )}
        <AnimatePresence>
          {membershipRates.map(({ r: rate, idx }) => (
            <motion.div key={idx} layout className="grid grid-cols-[.6fr,.6fr,.6fr,.6fr,.6fr,.6fr,.6fr,.8fr,50px] gap-1 px-2 py-1 border-b last:border-0 items-center">
              <Input type="number" className="h-8 text-xs font-bold" value={rate.aboveUnits} onChange={(e) => onChange(idx, "aboveUnits", Number(e.target.value))} />
              <Input type="number" className="h-8 text-xs" value={rate.enrChangesAllowed} onChange={(e) => onChange(idx, "enrChangesAllowed", Number(e.target.value))} />
              <Input type="number" className="h-8 text-xs" value={rate.enrFreezingAllowed} onChange={(e) => onChange(idx, "enrFreezingAllowed", Number(e.target.value))} />
              <Input type="number" className="h-8 text-xs" value={rate.minDaysInEnr} onChange={(e) => onChange(idx, "minDaysInEnr", Number(e.target.value))} />
              <Input type="number" className="h-8 text-xs" value={rate.discountOnDayReduce} onChange={(e) => onChange(idx, "discountOnDayReduce", Number(e.target.value))} />
              <Input type="number" className="h-8 text-xs font-bold" value={rate.unitRate} onChange={(e) => onChange(idx, "unitRate", Number(e.target.value))} />
              
              <Input
                type="number"
                placeholder="%"
                className="h-8 text-xs bg-yellow-100/30"
                value={rowPercentages[idx] || ""}
                onChange={(e) => {
                  const discount = Number(e.target.value || 0);
                  
                  const baseUnit = baseUnitRates[idx] ?? rate.unitRate;

                  setRowPercentages(prev => ({ ...prev, [idx]: e.target.value }));

                  const finalRate = Math.round(baseUnit * (discount/ 100));
                  onChange(idx, "unitRate", finalRate);
                }}
              />
              <div className="text-center bg-muted mx-5 py-2 text-xs font-medium">
                {(rate.unitRate * bulkFields.monthUnit).toLocaleString()}
              </div>

              <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(idx)} className="h-8 w-8 p-0 text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};