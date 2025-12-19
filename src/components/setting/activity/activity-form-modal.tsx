import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import { createActivity, updateActivity } from "@/api/activity.api";
import type { Activity } from "@/types/activity";
import { toast } from "@/hooks/use-toast";
import type { Enums } from "@/types/enums";
import { getEnumsByCategory } from "@/api/enums.api";
import type { FormFieldConfig } from "@/components/form-modal/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Activity> | null;
  onSaved?: (row: Activity) => void;
  layout?: "grid" | "list";
};

export function ActivityFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSaved,
  layout = "grid",
}: Props) {
  const isEdit = Boolean(initialData && initialData.activityId);

  const empty: Partial<Activity> = {
    activityName: initialData?.activityName ?? "",
    activityType: (initialData?.activityType ??
      "art") as Activity["activityType"],
    description: initialData?.description ?? "",
  };

  const [values, setValues] = useState<Partial<Activity>>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [activityType, setActivityType] = useState<Enums[]>([]);

  useEffect(() => {
    setValues({ ...empty, ...(initialData ?? {}) });
    setFieldErrors({});
    setError(null);

    const fetchActivity = async () => {
      const actRes = await getEnumsByCategory("ActivityType");
      const acrRows = actRes?.data as Enums[];
      setActivityType(acrRows);
    };

    fetchActivity();
  }, [initialData, isOpen]);

  const onChange = (field: keyof Activity, val: string) => {
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
    if (!values.activityName || String(values.activityName).trim() === "") {
      errs.activityName = "Activity name is required";
    }
    if (!values.activityType || String(values.activityType).trim() === "") {
      errs.activityType = "Activity type is required";
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
      const payload: Partial<Activity> = {
        activityName: String(values.activityName ?? "").trim(),
        activityType: String(
          values.activityType ?? ""
        ).trim() as Activity["activityType"],
        cgst: Number(values.cgst),
        sgst: Number(values.sgst),
        srgst: Number(values.srgst),
        description: String(values.description ?? "").trim(),
      };

      if (isEdit && initialData?.activityId) {
        await updateActivity(Number(initialData.activityId), payload);
      } else {
        await createActivity(payload as Activity);
      }

      toast({
        title: "Success",
        description: isEdit
          ? "Activity updated successfully"
          : "Activity created successfully",
        variant: "success",
      });
      onSaved?.(values as Activity);
      onClose();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save activity";
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
      name: "activityName",
      label: "Activity Name",
      type: "text",
      required: true,
    },
    {
      name: "cgst",
      label: "CGST",
      type: "Number",
      required: true,
    },
    {
      name: "sgst",
      label: "SGST",
      type: "Number",
      required: true,
    },
    {
      name: "srgst",
      label: "Service Accounting Code",
      type: "Number",
      required: true,
    },
    {
      name: "activityType",
      label: "Activity Type",
      type: "select",
      required: true,
      options: activityType?.map((a) => ({
        value: a.value,
        label: a.value,
      })),
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
    },
  ];

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
            title={isEdit ? "Edit Activity" : "Add Activity"}
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

export default ActivityFormModal;
