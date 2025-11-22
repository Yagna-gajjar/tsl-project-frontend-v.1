"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import {
  createFamilyType,
  editFamilyType,
  getFamilyTypes,
} from "@/api/family-type.api";
import type { FamilyType } from "@/types/familyType";
import { toast } from "@/hooks/use-toast";
import { log } from "util";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<FamilyType> | null;
  onSaved?: (row: FamilyType) => void;
  layout?: "grid" | "list";
};

export function FamilyTypeFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSaved,
  layout = "grid",
}: Props) {
  const isEdit = Boolean(initialData && initialData.familyTypeId);

  const empty: Partial<FamilyType> = {
    familyTypeName: initialData?.familyTypeName ?? "",
    prefix: initialData?.prefix ?? "",
    maxMembers: initialData?.maxMembers ?? 1,
  };

  const [values, setValues] = useState<Partial<FamilyType>>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues({ ...empty, ...(initialData ?? {}) });
    setFieldErrors({});
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isOpen]);

  const onChange = (field: keyof FamilyType, val: any) => {
    setValues((p) => ({ ...p, [field]: val }));
    setFieldErrors((prev) => {
      if (!prev[field as string]) return prev;
      const copy = { ...prev };
      delete copy[field as string];
      return copy;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!values.familyTypeName || String(values.familyTypeName).trim() === "") {
      errs.familyTypeName = "Family type name is required";
    }
    const mm = Number(values.maxMembers ?? 0);
    if (!Number.isFinite(mm) || mm < 1) {
      errs.maxMembers = "Max members must be a positive number";
    }
    return errs;
  };

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
      let res: any;
      const payload: Partial<FamilyType> = {
        familyTypeName: String(values.familyTypeName ?? "").trim(),
        prefix: values.prefix ?? "",
        maxMembers: Number(values.maxMembers ?? 1),
      };

      if (isEdit && initialData?.familyTypeId) {
        res = await editFamilyType(Number(initialData.familyTypeId), payload);
      } else {
        res = await createFamilyType(payload as FamilyType);
      }

      // prefer explicit success flag when available
      const ok =
        typeof res?.success !== "undefined" ? Boolean(res.success) : true;
      const row = res && (res.data ?? res) ? res.data ?? res : res;

      if (!ok) {
        // API responded but signalled failure
        const msg = res?.message ?? res?.error ?? "failed to submit";
        // show error toast and surface error to form
        setError(msg); 
        toast({
          title: "Save failed",
          description: msg,
          variant: "destructive",
        });
        // stop further processing
        return;
      }

      // success path
      toast({
        title: isEdit ? "Family type updated" : "Family type created",
        description: `${String(
          row?.familyTypeName ?? payload.familyTypeName
        )} saved successfully.`,
        variant: "success",
      });

      onSaved?.(row as FamilyType);
      onClose();
    } catch (err: any) {
      const message = err?.message ?? "failed to submit";
      setError(message);
      toast({
        title: "Save failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
    
  }, [values, isEdit, initialData, onClose, onSaved]);

  const fields = [
    {
      name: "familyTypeName",
      label: "Family Type Name",
      type: "text",
      required: true,
    },
    { name: "prefix", label: "Prefix", type: "text" },
    {
      name: "maxMembers",
      label: "Max Members",
      type: "number",
      required: true,
    },
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
            title={isEdit ? "Edit Family Type" : "Add Family Type"}
            onClose={onClose}
          />
          <div className="flex-1 overflow-y-auto">
            <FormContent
              fields={fields}
              values={values}
              errors={fieldErrors}
              loading={loading}
              error={error}
              isSubmitting={isSubmitting}
              onChange={onChange as any}
              layout={layout}
            />
          </div>
          <FormFooter
            onClose={onClose}
            onSubmit={handleSubmit as any}
            submitLabel={isEdit ? "Update" : "Create"}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FamilyTypeFormModal;
