import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import type { Account } from "@/types/account";
import type { Entity } from "@/types/entity";
import { createAccount, updateAccount } from "@/api/account.api";
import { getEntities } from "@/api/entity.api";
import { formatDateForInput } from "@/lib/utils";
import type { FormFieldConfig } from "@/components/form-modal/types";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";
import type { Enums } from "@/types/enums";
import { getEnumsByCategory } from "@/api/enums.api";

type Props = {
  isOpen: boolean;
  initialData?: Account;
  onClose: () => void;
  onSave: () => void;
};

const empty: Account = {
  accountId: 0,
  regDate: new Date(),
  suspensionDate: undefined,
  entityId: 0,
  defineEntity: "",
  name: "",
  addressId: undefined,
  contact: "",
  proffesionalSector: "",
  adminInstruction: "",

  line1: "",
  line2: "",
  city: "",
  state: "",
  country: "India",
  pinCode: "",
} as Account;

export default function AccountFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<Account>(empty);
  const [entities, setEntities] = useState<Entity[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [adminInstructionOpt, setAdminInstructionOpt] = useState<Enums[]>([]);


  useEffect(() => {
    const loadEntities = async () => {
      const res: Response<Entity[]> = await getEntities({ limit: 500 });
      setEntities(res.data ?? []);
    };
    loadEntities();
  }, []);

  useEffect(() => {
  
    if (initialData) {
      setValues({
        ...initialData,
        regDate: formatDateForInput(initialData.regDate),
        suspensionDate: initialData.suspensionDate
          ? formatDateForInput(initialData.suspensionDate)
          : undefined,

        line1: initialData.line1 || "",
        line2: initialData.line2 || "",
        city: initialData.city || "",
        state: initialData.state || "",
        country: initialData.country || "India",
        pinCode: initialData.pinCode || "",
      });
    } else {
      setValues(empty);
    }

    const fetchAdminInstructionOpt = async () => {
      const res: Response<Enums[]> = await getEnumsByCategory(
        "adminInstruction"
      );
      const data = res?.data as Enums[];
      setAdminInstructionOpt(data);
    };

    fetchAdminInstructionOpt()

  }, [initialData, isOpen]);
    
  const validate = useCallback(() => {
    const errs: Record<string, string> = {};

    if (!values.entityId) {
      errs.entityId = "Entity is required";
    }

    if (!values.name?.trim()) {
      errs.name = "Account name is required";
    }

    if (!values.line1 || String(values.line1).trim() === "")
      errs.line1 = "Address Line 1 is required";
    if (!values.city || String(values.city).trim() === "")
      errs.city = "City is required";
    if (!values.state || String(values.state).trim() === "")
      errs.state = "State is required";
    if (!values.country || String(values.country).trim() === "")
      errs.country = "Country is required";
    if (!values.pinCode || String(values.pinCode).trim() === "")
      errs.pinCode = "Pin Code is required";

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
        entityId: Number(values.entityId),
        addressId: values.addressId ? Number(values.addressId) : undefined,

        line1: values.line1,
        line2: values.line2,
        city: values.city,
        state: values.state,
        country: values.country,
        pinCode: values.pinCode,
      };
      
      if (initialData?.accountId) {
        const res: Response<Account> = await updateAccount(initialData.accountId, payload);
        if (res.success) {
          toast({ title: "Account Created", variant: "success" });
        } else {
          throw("Failed to created account")
        }
      } else {
        const res: Response<Account> = await createAccount(payload as Account);
        if (res.success) {
          toast({ title: "Account updated", variant: "success" });
        } else {
          throw "Failed to updated account";
        }
      }

      onSave();
      onClose();
    } catch {
      setError("Failed to save account");
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, initialData, validate, onSave, onClose]);
  

  const fields: FormFieldConfig<Account>[] = [
    {
      name: "entityId",
      label: "Entity",
      type: "select",
      options: entities.map((e) => ({
        label: e.entityName,
        value: e.entityId,
      })),
      required: true,
    },
    { name: "defineEntity", label: "Define Entity", type: "text" },
    { name: "name", label: "Account Name", type: "text", required: true },
    { name: "contact", label: "Contact", type: "text" },
    {
      name: "proffesionalSector",
      label: "Professional Sector",
      type: "text",
    },
    {
      name: "adminInstruction",
      label: "Admin Instruction",
      type: "select",
      options: adminInstructionOpt.map((a) => ({
        value: a.value,
        label: a.value,
      })),
    },

    { name: "line1", label: "Address Line 1", type: "text", required: true },
    { name: "line2", label: "Address Line 2", type: "text" },
    { name: "city", label: "City", type: "text", required: true },
    { name: "state", label: "State", type: "text", required: true },
    { name: "country", label: "Country", type: "text", required: true },
    { name: "pinCode", label: "Pin Code", type: "text", required: true },
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
        <div className="flex flex-col max-h-[70vh] overflow-hidden">
          <FormHeader
            title={initialData ? "Edit Account" : "Add Account"}
            onClose={onClose}
          />
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

        <FormFooter
          onClose={onClose}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
