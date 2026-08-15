import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import type { Entity } from "@/types/entity";
import type { FormFieldConfig } from "@/components/form-modal/types";
import { getEnumsByCategory } from "@/api/enums.api";
import type { Enums } from "@/types/enums";
import { format } from "date-fns";
import { createEntity, updateEntity } from "@/api/entity.api";
import type { Response } from "@/types/response";

type Props = {
  isOpen: boolean;
  initialData?: Entity;
  onClose: () => void;
  onSave: () => void;
  entityType: string;
};

const empty: Entity = {
  entityName: "",
  entityType: "",
  legalStatus: "",
  legalName: "",
  line1: "",
  line2: "",
  city: "",
  pinCode: "",
  state: "",
  country: "",
  financialDetails: "",
  gstRegNo: 0,
  otherFinancialDetails: "",
  email: "",
  officeContact: "",
  sector: "",
  entityNature: "",
  entityRole: "",
  status: "",
  regDate: new Date(),
  suspensionDate: undefined,
} as Entity;

export default function EntityFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
  entityType
}: Props) {
  const [values, setValues] = useState<Entity>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entityTypeOpt, setEntityTypeOpt] = useState<Enums[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [sectorEnum, setSectorEnum] = useState<Enums[]>([]);
  const [entityNatureEnum, setEntityNatureEnum] = useState<Enums[]>([]);
  const [entityRoleEnum, setEntityRoleEnum] = useState<Enums[]>([]);
  const [entityStatusEnum, setEntityStatusEnum] = useState<Enums[]>([]);

  useEffect(() => {
    if (initialData) {
      setValues({
        ...initialData,
        regDate: format(initialData.regDate, "yyyy-MM-dd"),
        suspensionDate: initialData.suspensionDate
          ? format(initialData.suspensionDate, "yyyy-MM-dd")
          : undefined,
      });
    } else {
      if (entityType.toLocaleLowerCase() !== "all") {
        setValues({ ...empty, entityType: entityType });
      } else {
        setValues(empty);
      }
    }

    const fetchEnums = async () => {
      const [typeRes, sectorRes, natureRes, roleRes, statusRes] = await Promise.all([
        getEnumsByCategory("ENTITYTYPE"),
        getEnumsByCategory("SECTOR"),
        getEnumsByCategory("ENTITYNATURE"),
        getEnumsByCategory("ENTITYROLE"),
        getEnumsByCategory("EntityStatus"),
      ]);
      setEntityTypeOpt((typeRes?.data as Enums[]) ?? []);
      setSectorEnum((sectorRes?.data as Enums[]) ?? []);
      setEntityNatureEnum((natureRes?.data as Enums[]) ?? []);
      setEntityRoleEnum((roleRes?.data as Enums[]) ?? []);
      setEntityStatusEnum((statusRes?.data as Enums[]) ?? []);
    };

    fetchEnums();
  }, [initialData, isOpen]);

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};

    if (!values.entityName?.trim()) {
      errs.entityName = "Entity name is required";
    }

    if (!values.entityType?.trim()) {
      errs.entityType = "Entity type is required";
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
      const payload = {
        ...values,
        regDate: values.regDate ? new Date(values.regDate) : undefined,
        suspensionDate: values.suspensionDate
          ? new Date(values.suspensionDate)
          : undefined,
      };

      if (initialData?.entityId) {
        const res: Response<Entity> = await updateEntity(
          initialData.entityId,
          payload
        );
        if (!res.success) {
          throw "Failed to create entity";
        }
      } else {
        const res: Response<Entity> = await createEntity(payload as any);
        if (!res.success) {
          throw "Failed to create entity";
        }
      }

      onSave();
      onClose();
    } catch {
      setError("Failed to save entity");
    } finally {
      setIsSubmitting(false);
    }
  }, [values, initialData, validate, onSave, onClose]);

  const fields = useMemo<FormFieldConfig<Entity>[]>(() => [
    { name: "entityName", label: "Entity Name", type: "text", required: true },
    { name: "regDate", label: "Registration Date", type: "Date" },
    {
      name: "suspensionDate",
      label: "Suspension Date",
      type: "Date",
    },
    {
      name: "entityType",
      label: "Entity Type",
      type: "select",
      options: entityTypeOpt?.map((e) => ({
        value: e.value,
        label: e.value,
      })),
      required: true,
    },
    { name: "legalStatus", label: "Legal Status", type: "text" },
    { name: "legalName", label: "Legal Name", type: "text" },
    { name: "line1", label: "Address Line 1", type: "text" },
    { name: "line2", label: "Address Line 2", type: "text" },
    { name: "city", label: "City", type: "text" },
    { name: "state", label: "state", type: "text" },
    { name: "pinCode", label: "pin Code", type: "text" },
    { name: "country", label: "country", type: "text" },
    { name: "financialDetails", label: "PAN", type: "text" },
    { name: "gstRegNo", label: "GST Reg No", type: "text" },
    {
      name: "otherFinancialDetails",
      label: "Other Financial Details",
      type: "text",
    },
    {
      name: "email",
      label: "Email",
      type: "text",
    },
    {
      name: "officeContact",
      label: "Office Contact",
      type: "text",
    },
    {
      name: "sector",
      label: "sector",
      type: "select",
      options: sectorEnum?.map((s) => ({
        value: s.value,
        label: s.value + " (" + s.enumCase + ")",
      })),
    },
    {
      name: "entityNature",
      label: "Entity Nature",
      type: "select",
      options: entityNatureEnum?.map((s) => ({
        value: s.value,
        label: s.value + " (" + s.enumCase + ")",
      })),
    },
    {
      name: "entityRole",
      label: "Entity Role",
      type: "select",
      options: entityRoleEnum?.map((s) => ({
        value: s.value,
        label: s.value + " (" + s.enumCase + ")",
      })),
    },
    {
      name: "status",
      label: "status",
      type: "select",
      options: entityStatusEnum?.map((s) => ({
        value: s.value,
        label: s.value + " (" + s.enumCase + ")",
      })),
    },
  ], [entityTypeOpt, sectorEnum, entityNatureEnum, entityRoleEnum, entityStatusEnum]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
        <div className="flex flex-col max-h-[70vh] overflow-hidden">
          <FormHeader
            title={initialData ? "Edit Entity" : "Add Entity"}
            onClose={onClose}
          />
          <div className="overflow-auto">
            <FormContent
              fields={fields}
              values={values}
              errors={fieldErrors}
              loading={false}
              error={error}
              isSubmitting={isSubmitting}
              onChange={(f, v) => {
                setValues((p) => ({ ...p, [f]: v }));
                setFieldErrors((prev) => {
                  if (!prev[f as string]) return prev;
                  const copy = { ...prev };
                  delete copy[f as string];
                  return copy;
                });
              }}
              layout="grid"
            />
          </div>
        </div>

        <FormFooter
          onClose={onClose}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
