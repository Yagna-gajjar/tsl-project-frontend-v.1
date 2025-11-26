import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import {
  createFacility,
  updateFacility
} from "@/api/facility.api";
import type { Facility } from "@/types/facility";
import { toast } from "@/hooks/use-toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Facility> | null;
  onSaved?: (row: Facility) => void;
  layout?: "grid" | "list";
};

export function FacilityFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSaved,
  layout = "grid",
}: Props) {
  const isEdit = Boolean(initialData && initialData.facilityId);

  const empty: Partial<Facility> = {
    facilityName: initialData?.facilityName ?? "",
    facilityType: initialData?.facilityType ?? "",
    facilityDimension: initialData?.facilityDimension ?? "",
    areaSQFT: initialData?.areaSQFT ?? undefined,
    description: initialData?.description ?? "",
    academicCapacity: initialData?.academicCapacity ?? undefined,
    recreationCapacity: initialData?.recreationCapacity ?? undefined,
    eventCapacity: initialData?.eventCapacity ?? undefined,
  };

  const [values, setValues] = useState<Partial<Facility>>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues({ ...empty, ...(initialData ?? {}) });
    setFieldErrors({});
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isOpen]);

  const onChange = (field: keyof Facility, val: string | number) => {
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
    if (!values.facilityName || String(values.facilityName).trim() === "") {
      errs.facilityName = "Facility name is required";
    }
    if (!values.facilityType || String(values.facilityType).trim() === "") {
      errs.facilityType = "Facility type is required";
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
      const payload: Partial<Facility> = {
        facilityName: String(values.facilityName ?? "").trim(),
        facilityType: String(values.facilityType ?? "").trim(),
        facilityDimension: values.facilityDimension ? String(values.facilityDimension).trim() : null,
        areaSQFT: values.areaSQFT ? Number(values.areaSQFT) : null,
        description: values.description ? String(values.description).trim() : null,
        academicCapacity: values.academicCapacity ? Number(values.academicCapacity) : null,
        recreationCapacity: values.recreationCapacity ? Number(values.recreationCapacity) : null,
        eventCapacity: values.eventCapacity ? Number(values.eventCapacity) : null,
      };

      if (isEdit && initialData?.facilityId) {
        await updateFacility(Number(initialData.facilityId), payload);
      } else {
        await createFacility(payload as Facility);
      }

      toast({
        description: isEdit
          ? "Facility updated successfully"
          : "Facility created successfully",
      });
      onSaved?.(values as Facility);
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save facility";
      setError(errorMsg);
      toast({
        variant: "destructive",
        description: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, isEdit, initialData, onSaved, onClose, validate]);

  const fields = [
    {
      name: "facilityName",
      label: "Facility Name",
      type: "text",
      required: true,
    },
    {
      name: "facilityType",
      label: "Facility Type",
      type: "text",
      required: true,
    },
    {
      name: "facilityDimension",
      label: "Facility Dimension",
      type: "text",
    },
    {
      name: "areaSQFT",
      label: "Area (SQFT)",
      type: "number",
    },
    {
      name: "academicCapacity",
      label: "Academic Capacity",
      type: "number",
    },
    {
      name: "recreationCapacity",
      label: "Recreation Capacity",
      type: "number",
    },
    {
      name: "eventCapacity",
      label: "Event Capacity",
      type: "number",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-lg p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
        <div className="flex flex-col max-h-[90vh] overflow-hidden">
          <FormHeader
            title={isEdit ? "Edit Facility" : "Add Facility"}
            onClose={onClose}
          />
          <div className="flex-1 overflow-y-auto">
            <FormContent
              fields={fields}
              values={values}
              errors={fieldErrors}
              loading={false}
              error={error}
              isSubmitting={isSubmitting}
              onChange={onChange}
              layout={layout}
            />
          </div>
          <FormFooter
            onClose={onClose}
            onSubmit={handleSubmit}
            submitLabel={isEdit ? "Update" : "Create"}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FacilityFormModal;
