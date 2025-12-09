import { useCallback, useEffect, useState } from "react";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import { createArea, updateArea } from "@/api/area.api";
import type { Area } from "@/types/area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getFacilities } from "@/api/facility.api";
import type { Response } from "@/types/response";
type Props = {
  isOpen: boolean;
  initialData?: Area;
  onClose: () => void;
  onSave: () => void;
};
import { toast } from "@/hooks/use-toast";
import type { Facility } from "@/types/facility";

const empty: Area = {
  areaId: 0,
  facilityId: 0,
  areaName: "",
  areaDimension: "",
  areaSQFT: undefined,
  portion: undefined,
  groundAreaPart: "",
} as Area;

export default function AreaFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<Area>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [facilityFields, setFacilityFields] = useState<[string, number][]>([]);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const res: Response<Facility[]> = await getFacilities({ limit: 1000 });
        const data = Array.isArray(res?.data) ? (res.data as Facility[]) : [];
        const options = data.map((f) => ({
          label: String(f.facilityName ?? ""),
          value: Number(f.facilityId ?? 0),
        }));
        setFacilityFields(options as unknown as [string, number][]);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load facilities.",
          variant: "destructive",
        });
      }
    };
    fetchFacilities();
  }, []);

  useEffect(() => {
    setValues({ ...empty, ...(initialData ?? {}) });
    setFieldErrors({});
    setError(null);
  }, [initialData, isOpen]);

  const onChange = (field: keyof Area, val: string | number) => {
    setValues((p) => ({ ...p, [field]: val }));

    setFieldErrors((prev) => {
      if (!prev[field as string]) return prev;
      const copy = { ...prev };
      delete copy[field as string];
      return copy;
    });
  };

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!values.areaName || String(values.areaName).trim() === "") {
      errs.areaName = "Area name is required";
    }
    if (!values.facilityId) {
      errs.facilityId = "Facility is required";
    }
    return errs;
  }, [values]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload: Partial<Area> = {
        areaName: values.areaName,
        facilityId: values.facilityId ? Number(values.facilityId) : undefined,
        areaDimension: values.areaDimension || undefined,
        areaSQFT: values.areaSQFT ? Number(values.areaSQFT) : undefined,
        portion: values.portion ? Number(values.portion) : undefined,
        groundAreaPart: values.groundAreaPart || undefined,
      };
      let res: Response;
      if (initialData?.areaId) {
        res = await updateArea(initialData.areaId, payload);
      } else {
        res = await createArea(
          payload as Omit<Area, "areaId" | "createdAt" | "updatedAt">
        );
      }

      const ok =
        typeof res?.success !== "undefined"
          ? res.success === true || String(res.success) === "true"
          : true;

      if (!ok) {
        const msg = res?.message ?? "Failed to save";
        setError(msg);

        toast({
          title: "Save failed",
          description: msg,
          variant: "destructive",
        });

        return;
      }

      onSave();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, values, initialData, onSave, onClose]);

  const fields = [
    { name: "areaName", label: "Area Name", type: "text", required: true },
    {
      name: "facilityId",
      label: "Facility",
      type: "select",
      options: facilityFields,
      required: true,
    },
    {
      name: "areaDimension",
      label: "Area Dimension",
      type: "text",
      required: false,
    },
    { name: "areaSQFT", label: "Area SQFT", type: "number", required: false },
    { name: "portion", label: "Portion", type: "number", required: false },
    {
      name: "groundAreaPart",
      label: "Ground Area Part",
      type: "text",
      required: false,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any;

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <div>
        <DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
          <div className="flex flex-col max-h-[90vh] overflow-hidden">
            <FormHeader
              title={initialData?.areaId ? "Edit Area" : "Add New Area"}
              onClose={onClose}
            />
            <div className="">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}
              <FormContent
                fields={fields}
                values={values}
                errors={fieldErrors}
                loading={false}
                error={error}
                isSubmitting={isSubmitting}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={onChange as any}
                layout="grid"
              />
            </div>
            <FormFooter
              onClose={onClose}
              onSubmit={handleSubmit}
              submitLabel={initialData?.areaId ? "Update" : "Create"}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}
