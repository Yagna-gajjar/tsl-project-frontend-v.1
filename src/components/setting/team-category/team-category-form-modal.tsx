import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import {
  createTeamCategories,
  editTeamCategories,
  getTeamCategoriesByID,
} from "@/api/team-category.api";
import type { TeamCategory } from "@/types/teamCategory";
import { toast } from "@/hooks/use-toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<TeamCategory> | null;
  onSaved?: (row: TeamCategory) => void;
  layout?: "grid" | "list";
};

export function TeamCategoryFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSaved,
  layout = "grid",
}: Props) {
  const isEdit = Boolean(initialData && initialData.teamCategoryId);

  const empty: Partial<TeamCategory> = {
    categoryName: initialData?.categoryName ?? "",
    shortName: initialData?.shortName ?? "",
    access: initialData?.access ?? "active",
    details: initialData?.details ?? "",
  };

  const [values, setValues] = useState<Partial<TeamCategory>>(empty);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues({ ...empty, ...(initialData ?? {}) });
    setFieldErrors({});
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isOpen]);

  // optionally fetch full item when editing (no UI change)
  useEffect(() => {
    if (!isOpen || !isEdit || !initialData?.teamCategoryId) return;
    setLoading(true);
    (async () => {
      try {
        const res: any = await getTeamCategoriesByID(
          Number(initialData.teamCategoryId)
        );
        const row = res && (res.data ?? res) ? res.data ?? res : res;
        if (row) {
          setValues({
            categoryName: row.categoryName ?? "",
            shortName: row.shortName ?? "",
            access: row.access ?? "active",
            details: row.details ?? "",
          });
        }
      } catch (e) {
        console.warn("Failed to fetch team category details", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, isEdit, initialData]);

  const onChange = (field: keyof TeamCategory, val: any) => {
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
    if (!values.categoryName || String(values.categoryName).trim() === "") {
      errs.categoryName = "Category name is required";
    }
    if (values.shortName && String(values.shortName).length > 50) {
      errs.shortName = "Short name too long (max 50 chars)";
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
      const payload: Partial<TeamCategory> = {
        categoryName: String(values.categoryName ?? "").trim(),
        shortName: values.shortName ?? "",
        access: values.access ?? "active",
        details: values.details ?? "",
      };

      let res: any;
      if (isEdit && initialData?.teamCategoryId) {
        res = await editTeamCategories(
          Number(initialData.teamCategoryId),
          payload
        );
      } else {
        res = await createTeamCategories(payload as TeamCategory);
      }

      // normalize response and prefer explicit success flag if present
      const ok =
        typeof res?.success !== "undefined"
          ? res === null
            ? false
            : res.success === true || String(res.success) === "true"
          : true;
      const row = res && (res.data ?? res) ? res.data ?? res : res;

      if (!ok) {
        const msg = res?.message ?? res?.error ?? "Save failed";
        setError(msg);
        toast({
          title: "Save failed",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      // success
      toast({
        title: isEdit ? "Team category updated" : "Team category created",
        description: `${String(
          row?.categoryName ?? payload.categoryName
        )} saved successfully.`,
        variant: "success",
      });

      onSaved?.(row as TeamCategory);
      onClose();
    } catch (err: any) {
      const message = err?.message ?? "Failed to save";
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
      name: "categoryName",
      label: "Category Name",
      type: "text",
      required: true,
    },
    { name: "shortName", label: "Short Name", type: "text" },
    {
      name: "access",
      label: "Access",
      type: "text",
      required: true,
    },
    { name: "details", label: "Details", type: "text" },
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
            title={isEdit ? "Edit Team Category" : "Add Team Category"}
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

export default TeamCategoryFormModal;
