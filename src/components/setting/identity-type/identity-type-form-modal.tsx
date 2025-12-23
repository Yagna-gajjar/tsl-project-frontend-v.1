import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import type { IdentityType } from "@/types/identityType";
import type { FamilyType } from "@/types/familyType";
import type { TeamCategory } from "@/types/teamCategory";

import {
  getIdentityTypesByID,
  createIdentityTypes,
  editIdentityTypes,
} from "@/api/identity-type.api";
import { getFamilyTypes } from "@/api/family-type.api";
import { getTeamCategories } from "@/api/team-category.api";
import { toast } from "@/hooks/use-toast";
import { IdCard } from "lucide-react";
import type { Response } from "@/types/response";

type Option = { label: string; value: string | number | Date | boolean | Object };

export function IdentityTypeFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSaved,
  layout = "grid",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<IdentityType> | null;
  onSaved?: (row: IdentityType) => void;
  layout?: "grid" | "list";
}) {
  const isEdit = Boolean(initialData && initialData.identityTypeId);

  const empty: IdentityType = {
    identityTypeName: initialData?.identityTypeName ?? "",
    familyTypeId: initialData?.familyTypeId ?? 0,
    teamCategoryId: initialData?.teamCategoryId ?? undefined,
    discount: initialData?.discount ?? 0,
  };

  const [values, setValues] = useState<IdentityType>(empty);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [familyOptions, setFamilyOptions] = useState<Option[]>([]);
  const [teamOptions, setTeamOptions] = useState<Option[]>([]);

  useEffect(() => {
    setValues({ ...empty, ...(initialData ?? {}) });
    setFieldErrors({});
    setError(null);
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    (async () => {
      try {
        const [fRes, tRes]: [fRes: Response<FamilyType[]>, tRes: Response<TeamCategory[]>] = await Promise.all([
          getFamilyTypes({ page: 1, limit: 500 }),
          getTeamCategories({ page: 1, limit: 500 }),
        ]);

        const fRows: FamilyType[] = Array.isArray(fRes)
          ? fRes
          : fRes?.data ?? [];
        const tRows: TeamCategory[] = Array.isArray(tRes)
          ? tRes
          : tRes?.data ?? [];

        setFamilyOptions(
          (fRows || []).map((f) => ({
            label: f.familyTypeName,
            value: f.familyTypeId ?? "",
          }))
        );
        setTeamOptions([
          { label: "No category (null)", value: "null" },
          ...(tRows || []).map((t) => ({
            label: t.categoryName,
            value: t.teamCategoryId ?? "",
          })),
        ]);
      } catch (e) {
        toast({
          title: "Error",
          description: "Dropdown load failed",
          variant: "destructive"
        })
        setFamilyOptions([]);
        setTeamOptions([{ label: "No category (null)", value: "null" }]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isEdit || !initialData?.identityTypeId) return;
    setLoading(true);
    (async () => {
      try {
        const res: Response<IdentityType> = await getIdentityTypesByID(
          Number(initialData.identityTypeId)
        );
        const row:any = res && (res.data ?? res) ? res.data ?? res : res;
        if (row) setValues({ ...row });
      } catch (e) {
        console.warn("Failed to fetch identity type", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, isEdit, initialData]);

  const onChange = (field: keyof IdentityType, val: number | string | boolean | Object | Date) => {
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
    if (
      !values.identityTypeName ||
      String(values.identityTypeName).trim() === ""
    ) {
      errs.identityTypeName = "Identity name is required";
    }
    if (!values.familyTypeId && values.familyTypeId !== 0) {
      errs.familyTypeId = "Family type is required";
    }
    if (values.discount !== undefined && values.discount !== null) {
      const d = Number(values.discount);
      if (!Number.isFinite(d) || d <= -0.001 || d >= 100.001) {
        errs.discount = "Discount must be greater than 0 and less than 100";
      }
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
      const payload: Partial<IdentityType> = {
        identityTypeName: String(values.identityTypeName ?? "null").trim(),
        familyTypeId: values.familyTypeId ?? undefined,
        teamCategoryId:
          values.teamCategoryId === undefined
            ? undefined
            : values.teamCategoryId ?? undefined,
        discount: values.discount ?? 0,
      };

      let res: Response<IdentityType>;
      if (isEdit && initialData?.identityTypeId) {
        res = await editIdentityTypes(
          Number(initialData.identityTypeId),
          payload
        );
      } else {
        res = await createIdentityTypes(payload as IdentityType);
      }

      const ok =
        typeof res?.success !== "undefined" ? Boolean(res.success) : true;
      const row = res && (res.data ?? res) ? res.data ?? res : res;

      if (!ok) {
        const message = res?.message ?? "Failed to save";

        setError(message);
        toast({
          title: "Save failed",
          description: message,
          variant: "destructive",
        });

        return;
      }

      toast({
        title: isEdit ? "Identity type updated" : "Identity type created",
        description: `${String(
          payload.identityTypeName
        )} saved successfully.`,
        variant: "success",
      });

      onSaved?.(row as IdentityType);
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

  const fields = useMemo(
    () => [
      {
        name: "identityTypeName",
        label: "Identity Name",
        type: "text",
        required: true,
      },
      {
        name: "familyTypeId",
        label: "Family Type",
        type: "select",
        options: familyOptions,
        required: true,
      },
      {
        name: "teamCategoryId",
        label: "Team Category",
        type: "select",
        options: teamOptions,
      },
      { name: "discount", label: "Discount", type: "number" },
    ],
    [familyOptions, teamOptions]
  );

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
            title={isEdit ? "Edit Identity Type" : "Add Identity Type"}
            icon={<IdCard />}
            onClose={onClose}
          />
          <div className="flex-1 overflow-y-auto">
            <FormContent
              fields={fields as any}
              values={values as any}
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

export default IdentityTypeFormModal;
