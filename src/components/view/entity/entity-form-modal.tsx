import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import type { Entity } from "@/types/entity";
import { createEntity, updateEntity } from "@/api/entity.api";
import { formatDateForInput } from "@/lib/utils";
import type { FormFieldConfig } from "@/components/form-modal/types";
import { toast } from "@/hooks/use-toast";
import { getEnumsByCategory } from "@/api/enums.api";
import type { Enums } from "@/types/enums";

type Props = {
  isOpen: boolean;
  initialData?: Entity;
  onClose: () => void;
  onSave: () => void;
};

const empty: Entity = {
  entityId: 0,
  entityName: "",
  entityType: "",
  legalStatus: "",
  legalName: "",
  regDate: new Date(),
  suspensionDate: undefined,
} as Entity;

export default function EntityFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<Entity>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entityTypeOpt, setEntityTypeOpt] = useState<Enums[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (initialData) {
      setValues({
        ...initialData,
        regDate: formatDateForInput(initialData.regDate),
        suspensionDate: initialData.suspensionDate
          ? formatDateForInput(initialData.suspensionDate)
          : undefined,
      });
    } else {
      setValues(empty);
    }

    const fetchEntityType = async () => {
      const res = await getEnumsByCategory( "EntityType" );
      const data = res?.data as Enums[];
      setEntityTypeOpt(data);
    };

    fetchEntityType();
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
        await updateEntity(initialData.entityId, payload);
      } else {
        await createEntity(payload as any);
      }

      onSave();
      onClose();
    } catch {
      setError("Failed to save entity");
    } finally {
      setIsSubmitting(false);
    }
  }, [values, initialData, validate, onSave, onClose]);
  

  const fields: FormFieldConfig<Entity>[] = [
    { name: "entityName", label: "Entity Name", type: "text", required: true },
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
    { name: "regDate", label: "Registration Date", type: "Date" },
    {
      name: "suspensionDate",
      label: "Suspension Date",
      type: "Date",
    },
  ];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
        <div className="flex flex-col max-h-[90vh] overflow-hidden">
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
