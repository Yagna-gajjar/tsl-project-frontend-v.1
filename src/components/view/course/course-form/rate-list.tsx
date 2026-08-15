import { getMembershipMasters } from "@/api/membershipMaster.api";
import { SearchableMultiselect } from "@/components/form-modal/form-field-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import type { CourseRate } from "@/types/courseRate";
import type { MembershipMaster } from "@/types/membershipMaster";
import type { Response } from "@/types/response";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Check } from "lucide-react";
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

interface RatesListProps {
  rates: CourseRate[];
  onChange: (index: number, field: keyof CourseRate, value: any) => void;
  onRemove: (index: number) => void;
  selectedMembership?: number | null;
  setSelectedMembership?: Dispatch<SetStateAction<number | null>>;
}

const DEFAULT_ABOVE_UNITS = [0, 6, 29, 89, 179, 364];

type BulkFields = {
  enrChangesAllowed: string;
  enrFreezingAllowed: string;
  minDaysInEnr: string;
  discountOnDayReduce: string;
};

export const RatesList = ({
  rates,
  onChange,
  onRemove,
  selectedMembership,
  setSelectedMembership
}: RatesListProps) => {
  const [membershipMasterOpt, setMembershipMasterOpt] = useState<MembershipMaster[]>([]);
  const [membershipMasterPage, setMembershipMasterPage] = useState(1);
  const [hasMoreMembershipMaster, setHasMoreMembershipMaster] = useState(true);
  const [loadingMembershipMaster, setLoadingMembershipMaster] = useState(false);

  const [bulkFields, setBulkFields] = useState<BulkFields>({
    enrChangesAllowed: "",
    enrFreezingAllowed: "",
    minDaysInEnr: "",
    discountOnDayReduce: "",
  });

  // Each tier (row) can have its own package price / duration — e.g. 2500 for
  // 30 days, 6000 for 180 days — so Base Rate & Days are entered per row and
  // only used locally to derive that row's exact Unit Rate.
  const [rowBaseRate, setRowBaseRate] = useState<Record<number, string>>({});
  const [rowDays, setRowDays] = useState<Record<number, string>>({});


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

    membershipRates.forEach(({ idx }) => {
      if (bulkFields.enrChangesAllowed !== "")
        onChange(idx, "enrChangesAllowed", Number(bulkFields.enrChangesAllowed));

      if (bulkFields.enrFreezingAllowed !== "")
        onChange(idx, "enrFreezingAllowed", Number(bulkFields.enrFreezingAllowed));

      if (bulkFields.minDaysInEnr !== "")
        onChange(idx, "minDaysInEnr", Number(bulkFields.minDaysInEnr));

      if (bulkFields.discountOnDayReduce !== "")
        onChange(idx, "discountOnDayReduce", Number(bulkFields.discountOnDayReduce));
    });

    toast({ title: "Applied", description: "Bulk values applied correctly." });
  };

  // Derives this row's exact Unit Rate from its own Base Rate / Days.
  // Keeps 4-decimal precision (matches the NUMERIC(12,4) unitRate column)
  // instead of rounding to 2 decimals, so unitRate * days reproduces the
  // exact Base Rate for billing.
  const applyRowRate = (idx: number, baseRateStr: string, daysStr: string) => {
    const bRate = parseFloat(baseRateStr);
    const days = parseFloat(daysStr);
    if (isNaN(bRate) || isNaN(days) || days === 0) return;

    const unitRate = Math.round((bRate / days) * 10000) / 10000;
    onChange(idx, "unitRate", unitRate);
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
            <Button key={id} type="button" size="sm" variant={selectedMembership === id ? "default" : "outline"} onClick={() => setSelectedMembership?.(Number(id))}>
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
          onChange={(v) => setSelectedMembership?.(v ?? null)}
        />


        <div className="grid grid-cols-4 md:grid-cols-5 items-end gap-2">
          {(["enrChangesAllowed", "enrFreezingAllowed", "minDaysInEnr", "discountOnDayReduce"] as const).map((f) => (
            <div key={f} className="flex flex-col">
              <label className="text-[10px] uppercase text-muted-foreground">{f.replace(/([A-Z])/g, ' $1')}</label>
              <Input type="number" className="h-8" value={bulkFields[f]} onChange={(e) => setBulkFields(p => ({ ...p, [f]: e.target.value }))} />
            </div>
          ))}
          <Button type="button" onClick={handleApplyBulk} className="h-8">
            <Check className="w-4 h-4 mr-1" /> Apply
          </Button>
        </div>

      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[.6fr,.6fr,.6fr,.6fr,.6fr,.8fr,.6fr,.8fr,.8fr,50px] gap-1 px-2 py-2 bg-muted/50 text-center text-[10px] font-bold border rounded-t-md">
        <div>Above Units</div>
        <div>Enr Changes</div>
        <div>Enr Freezing</div>
        <div>Min Days</div>
        <div>Discount Red.</div>
        <div>Base Rate</div>
        <div>Days</div>
        <div>Unit Rate</div>
        <div>Rate * Days</div>
        <div></div>
      </div>

      {/* Rows */}
      <div className="border border-t-0 rounded-b-md">
        {!isMembershipAlreadyGenerated && selectedMembership && (
          <div className="p-8 flex justify-center"><Button variant="secondary" onClick={addDefaultRates}>Generate Default Rates</Button></div>
        )}
        <AnimatePresence>
          {membershipRates.map(({ r: rate, idx }) => {
            const baseRateVal = rowBaseRate[idx] ?? "";
            const daysVal = rowDays[idx] ?? "";

            return (
              <motion.div key={idx} layout className="grid grid-cols-[.6fr,.6fr,.6fr,.6fr,.6fr,.8fr,.6fr,.8fr,.8fr,50px] gap-1 px-2 py-1 border-b last:border-0 items-center">
                <Input type="number" className="h-8 text-xs font-bold" value={rate.aboveUnits} onChange={(e) => onChange(idx, "aboveUnits", Number(e.target.value))} />
                <Input type="number" className="h-8 text-xs" value={rate.enrChangesAllowed} onChange={(e) => onChange(idx, "enrChangesAllowed", Number(e.target.value))} />
                <Input type="number" className="h-8 text-xs" value={rate.enrFreezingAllowed} onChange={(e) => onChange(idx, "enrFreezingAllowed", Number(e.target.value))} />
                <Input type="number" className="h-8 text-xs" value={rate.minDaysInEnr} onChange={(e) => onChange(idx, "minDaysInEnr", Number(e.target.value))} />
                <Input type="number" className="h-8 text-xs" value={rate.discountOnDayReduce} onChange={(e) => onChange(idx, "discountOnDayReduce", Number(e.target.value))} />

                <Input
                  type="number"
                  placeholder="e.g. 2500"
                  className="h-8 text-xs border-primary bg-primary/5"
                  value={baseRateVal}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRowBaseRate((prev) => ({ ...prev, [idx]: v }));
                    applyRowRate(idx, v, daysVal);
                  }}
                />
                <Input
                  type="number"
                  placeholder="e.g. 30"
                  className="h-8 text-xs border-primary bg-primary/5"
                  value={daysVal}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRowDays((prev) => ({ ...prev, [idx]: v }));
                    applyRowRate(idx, baseRateVal, v);
                  }}
                />

                <Input
                  type="number"
                  disabled
                  title="Set via this row's Base Rate ÷ Days, not editable directly"
                  className="h-8 text-xs font-bold disabled:opacity-100 disabled:cursor-not-allowed bg-muted"
                  value={rate.unitRate}
                />

                <div className="text-center bg-muted mx-2 py-2 text-xs font-medium">
                  {/* Show the Base Rate as typed rather than reconstructing it by
                      multiplying the rounded Unit Rate back out — that reintroduces
                      the rounding this column exists to verify against. */}
                  {baseRateVal
                    ? Number(baseRateVal).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : daysVal
                      ? (rate.unitRate * Number(daysVal)).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "-"}
                </div>

                <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(idx)} className="h-8 w-8 p-0 text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};