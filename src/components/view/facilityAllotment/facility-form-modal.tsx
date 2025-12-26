import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormContent } from "@/components/form-modal/form-content";
import { FormFooter } from "@/components/form-modal/form-footer";
import type { FacilityAllotment } from "@/types/facilityAllotment";
import {
  createFacilityAllotment,
  updateFacilityAllotment,
} from "@/api/facilityAllotment.api";
import { toast } from "@/hooks/use-toast";
import { getFacilities } from "@/api/facility.api";
import { getAreas } from "@/api/area.api";
import type { Facility } from "@/types/facility";
import type { Area } from "@/types/area";
import type { Batch } from "@/types/batch";
import { getBatch } from "@/api/batch.api";
import type { Response } from "@/types/response";
import type { FormFieldConfig } from "@/components/form-modal/types";

type Props = {
  isOpen: boolean;
  initialData?: FacilityAllotment;
  onClose: () => void;
  onSave: () => void;
};

const empty: FacilityAllotment = {
  facilityAllotmentId: 0,
  facilityId: undefined,
  areaId: undefined,
  batchId: undefined,
  level: 1,
  assignmentDate: undefined,
  unAssignmentDate: undefined,
};

export default function FacilityAllotmentFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<FacilityAllotment>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [facilityOptions, setFacilityOptions] = useState<Facility[]>([]);
  const [areaOptions, setAreaOptions] = useState<Area[]>([]);
  const [batchOptions, setBatchOptions] = useState<Batch[]>([]);

  useEffect(() => {
    setValues({ ...empty, ...(initialData ?? {}) });
    setFieldErrors({});
    setError(null);
  }, [initialData, isOpen]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [fRes, bRes] = await Promise.all([
          getFacilities({ limit: 1000 }),
          getBatch({ limit: 1000 }),
        ]);

        const facilities = Array.isArray(fRes?.data)
          ? fRes.data
          : Array.isArray(fRes)
            ? fRes
            : [];
        const batches = Array.isArray(bRes?.data)
          ? bRes.data
          : Array.isArray(bRes)
            ? bRes
            : [];

        setFacilityOptions(facilities);
        setBatchOptions(batches);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load options",
          variant: "destructive",
        });
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const ares: Response<Area[]> = await getAreas({
          limit: 1000,
          facilityId: Number(values.facilityId),
        });

        const areas = Array.isArray(ares?.data)
          ? ares.data
          : Array.isArray(ares)
            ? ares
            : [];

        setAreaOptions(areas);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch Areas",
          variant: "destructive",
        });
      }
    };
    if (
      values.facilityId !== 0 &&
      values.facilityId != undefined &&
      values.facilityId != null
    ) {
      fetchAreas();
    }
  }, [values.facilityId]);

  const onChange = (
    field: keyof FacilityAllotment,
    val: string | number | null
  ) => {
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
    if (!values.facilityId) errs.facilityId = "Facility is required";
    if (!values.areaId) errs.areaId = "Area is required";
    if (!values.batchId) errs.batchId = "Batch is required";
    if (values.assignmentDate && values.unAssignmentDate) {
      const s = new Date(String(values.assignmentDate));
      const e = new Date(String(values.unAssignmentDate));
      if (s > e)
        errs.unAssignmentDate =
          "Unassignment date must be after assignment date";
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
      const payload: Partial<FacilityAllotment> = {
        facilityId: values.facilityId ? Number(values.facilityId) : undefined,
        areaId: values.areaId ? Number(values.areaId) : undefined,
        batchId: values.batchId ? Number(values.batchId) : undefined,
        level: values.level ? Number(values.level) : 1,
        assignmentDate: values.assignmentDate ?? undefined,
        unAssignmentDate: values.unAssignmentDate ?? undefined,
      };

      let res;
      if (initialData?.facilityAllotmentId) {
        res = await updateFacilityAllotment(
          initialData.facilityAllotmentId,
          payload
        );
      } else {
        res = await createFacilityAllotment(
          payload as Omit<
            FacilityAllotment,
            "facilityAllotmentId" | "createdAt" | "updatedAt"
          >
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

  const fields: FormFieldConfig<FacilityAllotment>[] = [
    {
      name: "facilityId",
      label: "Facility",
      type: "select",
      options: facilityOptions.map((f) => ({
        label: f.facilityName,
        value: f.facilityId,
      })),
      required: true,
    },
    {
      name: "areaId",
      label: "Area",
      type: "select",
      options: areaOptions.map((a) => ({
        label: a.areaName,
        value: a.areaId,
      })),
      required: true,
    },
    {
      name: "batchId",
      label: "Batch",
      type: "select",
      options: batchOptions.map((b) => ({
        label: b.batchName,
        value: b.batchId,
      })),
      required: true,
    },
    {
      name: "level",
      label: "Level",
      type: "number",
      required: true,
    },
    {
      name: "assignmentDate",
      label: "Assignment Date",
      type: "Date",
      required: false,
    },
    {
      name: "unAssignmentDate",
      label: "Unassignment Date",
      type: "Date",
      required: false,
    },
  ];

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
        <div className="flex flex-col max-h-[90vh] overflow-hidden">
          <FormHeader
            title={
              initialData?.facilityAllotmentId
                ? "Edit Facility Allotment"
                : "Add Facility Allotment"
            }
            onClose={onClose}
          />
          <div>
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
              onChange={onChange}
              layout="grid"
            />
          </div>
          <FormFooter
            onClose={onClose}
            onSubmit={handleSubmit}
            submitLabel={initialData?.facilityAllotmentId ? "Update" : "Create"}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
