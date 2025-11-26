"use client";

import { useCallback, useMemo } from "react";
import type { Enums } from "@/types/enums";
import { createEnum, updateEnum } from "@/api/enums.api";
import { FormModal } from "@/components/form-modal/form-modal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Enums> | null;
  onSaved?: (row: Enums) => void;
  title?: string;
};

export default function EnumsFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSaved,
  title,
}: Props) {
  const isEdit = Boolean(initialData && initialData.id);

  const fields = useMemo(
    () => [
      {
        name: "category",
        label: "Category",
        type: "text",
        placeholder: "Category (e.g. role, status)",
        required: true,
      },
      {
        name: "value",
        label: "Value",
        type: "text",
        placeholder: "Enum value",
        required: true,
      },
    ],
    []
  );

  // onSubmit receives the whole values object (Partial<Enums>) because FormModal is generic
  const handleSubmit = useCallback(
    async (values: Partial<Enums>) => {
      const payload: Partial<Enums> = {
        category: String(values.category ?? "").trim(),
        value: String(values.value ?? "").trim(),
      };

      let res: any;
      if (isEdit && initialData?.id) {
        res = await updateEnum(Number(initialData.id), payload);
      } else {
        res = await createEnum(payload as Enums);
      }

      // normalize row from response
      const row = res && (res.data ?? res) ? res.data ?? res : res;
      if (!row) throw new Error((res as any)?.message ?? "Save failed");

      // call parent callback (page) so it can refresh list
      onSaved?.(row as Enums);

      // FormModal will handle closing via its own onClose prop in the caller.
      return row;
    },
    [isEdit, initialData, onSaved]
  );

  return (
    <FormModal<Partial<Enums>>
      isOpen={isOpen}
      onClose={onClose}
      title={title ?? (isEdit ? "Edit Enum" : "Add Enum")}
      fields={fields as any}
      initialData={initialData ?? {}}
      onSubmit={handleSubmit as any}
      submitLabel={isEdit ? "Update" : "Create"}
      layout="grid"
    />
  );
}
