import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import { getFamilyTypes } from "@/api/family-type.api";
import { getTeamCategories } from "@/api/team-category.api";
import { getIdentityTypes } from "@/api/identity-type.api";
import { createFamily, updateFamily } from "@/api/family.api";
import type { Family } from "@/types/family";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";

type Option = { label: string; value: any };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Family> | null;
  onSaved?: (row: Family) => void;
  layout?: "grid" | "list";
};

export function FamilyFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSaved,
  layout = "grid",
}: Props) {
  const isEdit = Boolean(initialData && initialData.familyId);

  const empty: Partial<Family> = {
    familyName: "",
    familyTypeId: (initialData && initialData.familyTypeId) ?? undefined,
    teamCategoryId: (initialData && initialData.teamCategoryId) ?? undefined,
    identityTypeId: (initialData && initialData.identityTypeId) ?? undefined,
    profession: initialData?.profession ?? "",
    professionDetails: initialData?.professionDetails ?? "",
    designation: initialData?.designation ?? "",
    emergencyContact: initialData?.emergencyContact ?? "",
    remarks: initialData?.remarks ?? "",
    email: initialData?.email ?? "",
    status: initialData?.status ?? "active",
    preferredLanguage: initialData?.preferredLanguage ?? "",
  };

  const [values, setValues] = useState<Partial<Family>>(empty);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [familyTypeOptions, setFamilyTypeOptions] = useState<Option[]>([]);
  const [teamCategoryOptions, setTeamCategoryOptions] = useState<Option[]>([]);
  const [identityTypeOptions, setIdentityTypeOptions] = useState<Option[]>([]);
  const [itRows, setItRows] = useState([]);
  // field-level errors shown in the form
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues({ ...empty, ...(initialData ?? {}) });
    setError(null);
    setFieldErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    (async () => {
      try {
        const [ft, tc, it]: any = await Promise.all([
          getFamilyTypes({ page: 1, limit: 500 } as any),
          getTeamCategories({ page: 1, limit: 500 } as any),
          getIdentityTypes({ page: 1, limit: 500 } as any),
        ]);

        const norm = (r: any) => (r && (r.data ?? r.rows ?? r)) ?? [];

        const ftRows = Array.isArray(norm(ft)) ? norm(ft) : [];
        const tcRows = Array.isArray(norm(tc)) ? norm(tc) : [];
        const itRows = Array.isArray(norm(it)) ? norm(it) : [];
        setItRows(itRows);
        setFamilyTypeOptions(
          ftRows.map((r: any) => ({
            label: r.familyTypeName,
            value: r.familyTypeId,
          }))
        );
        setTeamCategoryOptions(
          tcRows.map((r: any) => ({
            label: r.categoryName,
            value: r.teamCategoryId,
          }))
        );
      } catch (e) {
        console.warn("dropdown load failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  useEffect(() => {
    console.log(itRows, "ppp", values);
    setIdentityTypeOptions(
      itRows
        .filter((r: any) => r.familyTypeId === Number(values.familyTypeId))
        .map((r: any) => ({
          label: r.identityTypeName,
          value: r.identityTypeId,
        }))
    );
  }, [values]);

  // determine whether selected family type is "team" (case-insensitive)
  const showTeamCategory = useMemo(() => {
    if (!values.familyTypeId) return false;
    const opt = familyTypeOptions.find(
      (o) => String(o.value) === String(values.familyTypeId)
    );
    return Boolean(opt && String(opt.label).trim().toLowerCase() === "team");
  }, [values.familyTypeId, familyTypeOptions]);

  // when familyType switches to non-team, clear teamCategoryId
  useEffect(() => {
    if (!showTeamCategory && values.teamCategoryId) {
      setValues((p) => ({ ...p, teamCategoryId: undefined }));
    }
  }, [showTeamCategory]);

  const onChange = (field: keyof Family, val: any) => {
    setValues((p) => ({ ...p, [field]: val }));
    // clear field-level error for that field when user changes it
    setFieldErrors((prev) => {
      if (!prev[field as string]) return prev;
      const copy = { ...prev };
      delete copy[field as string];
      return copy;
    });
  };

  // validation helpers
  const validateEmail = (email?: string) => {
    if (!email) return false;
    const s = String(email).trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(s);
  };

  const validatePhone = (phone?: string) => {
    if (!phone) return false;
    const s = String(phone).trim();
    // strip non-digit chars (keep leading + optional)
    const digits = s.replace(/\D/g, "");
    // reasonable length check: 7-15 digits
    return digits.length == 10;
  };

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    // prepare values for validation
    const emailVal = String(values.email ?? "").trim();
    const contactVal = String(values.emergencyContact ?? "").trim();

    const newFieldErrors: Record<string, string> = {};

    // email validation (if provided)
    if (emailVal && !validateEmail(emailVal)) {
      newFieldErrors.email = "Enter a valid email address";
    }

    // contact validation (if provided) - require at least when non-empty
    if (contactVal && !validatePhone(contactVal)) {
      newFieldErrors.emergencyContact =
        "Enter a valid contact number (10 digits)";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        familyName: String(values.familyName ?? "").trim(),
        identityTypeId: values.identityTypeId ?? null,
        profession: values.profession ?? "",
        professionDetails: values.professionDetails ?? "",
        designation: values.designation ?? "",
        emergencyContact: contactVal || null,
        remarks: values.remarks ?? "",
        email: emailVal || null,
        status: values.status ?? "active",
        preferredLanguage: values.preferredLanguage ?? "",
        familyTypeId: values.familyTypeId ?? null,
        teamCategoryId: values.teamCategoryId ?? null,
      } as Partial<Family>;

      if (!payload.familyName) {
        setError("Family name is required");

        toast({
          title: "Validation failed",
          description: "Family name is required.",
          variant: "destructive",
        });

        setIsSubmitting(false);
        return;
      }

      let res: Response;
      if (isEdit && initialData?.familyId) {
        res = await updateFamily(Number(initialData.familyId), payload);
      } else {
        res = await createFamily(payload as Family);
      }

      const ok =
        typeof res?.success !== "undefined"
          ? res.success === true || String(res.success) === "true"
          : true;

      const row = res?.data ?? res;

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

      toast({
        title: isEdit ? "Family updated" : "Family created",
        description: `${String(
          row?.familyName ?? payload.familyName
        )} saved successfully.`,
        variant: "success",
      });

      onSaved?.(row as Family);
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

  const fields = useMemo(() => {
    const base = [
      {
        name: "familyName",
        label: "Family Name",
        type: "text",
        placeholder: "Family name",
        required: true,
      },
      {
        name: "familyTypeId",
        label: "Family Type",
        type: "select",
        options: familyTypeOptions,
      },
      {
        name: "identityTypeId",
        label: "Identity Type",
        type: "select",
        options: identityTypeOptions,
      },
      { name: "profession", label: "Profession", type: "text" },
      { name: "professionDetails", label: "Profession Details", type: "text" },
      { name: "designation", label: "Designation", type: "text" },
      { name: "emergencyContact", label: "Emergency Contact", type: "text" },
      { name: "email", label: "Email", type: "text" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
          { label: "Block", value: "block" },
        ],
      },
      { name: "preferredLanguage", label: "Preferred Language", type: "text" },
      { name: "remarks", label: "Remarks", type: "text" },
    ];

    const list = [...base];

    if (showTeamCategory) {
      const insertIndex = list.findIndex((f) => f.name === "identityTypeId");
      list.splice(insertIndex, 0, {
        name: "teamCategoryId",
        label: "Team Category",
        type: "select",
        options: teamCategoryOptions,
      });
    }

    return list;
  }, [
    showTeamCategory,
    familyTypeOptions,
    identityTypeOptions,
    teamCategoryOptions,
  ]);

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
            title={isEdit ? "Edit Family" : "Add Family"}
            onClose={onClose}
          />
          <div className="flex-1 overflow-y-auto">
            <FormContent
              fields={fields as any}
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

export default FamilyFormModal;
