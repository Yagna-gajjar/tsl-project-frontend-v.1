import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import type { Account } from "@/types/account";
import type { Entity } from "@/types/entity";
import { createAccount, updateAccount, getAccounts } from "@/api/account.api";
import { getEntities } from "@/api/entity.api";
import type { FormFieldConfig } from "@/components/form-modal/types";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";
import type { Enums } from "@/types/enums";
import { getEnumsByCategory } from "@/api/enums.api";
import { format } from "date-fns";

/* -------------------- CONSTANTS -------------------- */

const SYSTEM_ACCOUNT_TYPES = [
  "Main",
  "Expenses",
  "Deposits",
  "SGST",
  "CGST",
  "Other",
] as const;

const RESTRICTED_ENUM_CASES = [4, 5, 6];

/* -------------------- TYPES -------------------- */

type AccountData = {
  entityId?: number;
  entityType?: string;
};

type Props = {
  isOpen: boolean;
  initialData?: Account;
  accountData?: AccountData;
  onClose: () => void;
  onSave: () => void;
  entityEnumCase: number;
  entityId: number;
};

/* -------------------- DEFAULT -------------------- */

const empty: Account = {
  accountId: 0,
  regDate: format(new Date(), "yyyy-MM-dd"),
  suspensionDate: undefined,
  entityId: 0,
  defineEntity: "Family",
  accountName: "",
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

/* -------------------- COMPONENT -------------------- */

export default function AccountFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
  accountData,
  entityEnumCase,
  entityId,
}: Props) {
  const [values, setValues] = useState<Account>(empty);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [adminInstructionOpt, setAdminInstructionOpt] = useState<Enums[]>([]);
  const [accountTypeOpt, setAccountTypeOpt] = useState<Enums[]>([]);
  const [entityPrefix, setEntityPrefix] = useState("");

  const [existingSystemCount, setExistingSystemCount] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [generateSystem, setGenerateSystem] = useState(false);

  /* -------------------- LOAD ENTITIES -------------------- */

  useEffect(() => {
    const load = async () => {
      const res: Response<Entity[]> = await getEntities({ limit: 500 });
      setEntities(res.data ?? []);
    };
    load();
  }, []);

  /* -------------------- LOAD ENUMS -------------------- */

  useEffect(() => {
    if (!isOpen) return;

    const loadEnums = async () => {
      const admin = await getEnumsByCategory("ADMITINSTRUCTIONS");
      const accType = await getEnumsByCategory("ACCOUNTTYPE");
      setAdminInstructionOpt(admin.data ?? []);
      setAccountTypeOpt(accType.data ?? []);
    };

    loadEnums();
  }, [isOpen]);

  /* -------------------- LOAD EXISTING SYSTEM ACCOUNTS -------------------- */

  useEffect(() => {
    if (!entityId || !RESTRICTED_ENUM_CASES.includes(entityEnumCase)) return;

    const loadSystemAccounts = async () => {
      const res = await getAccounts({
        entityId,
        accountTypes: SYSTEM_ACCOUNT_TYPES,
      });
      setExistingSystemCount(res.data?.length ?? 0);
    };

    loadSystemAccounts();
  }, [entityId, entityEnumCase]);

  /* -------------------- INITIAL DATA -------------------- */

  useEffect(() => {
    if (initialData) {
      setValues({ ...initialData });
    } else {
      setValues(empty);
    }
  }, [initialData]);

  /* -------------------- ENTITY PREFIX -------------------- */

  useEffect(() => {
    if (!values.entityId) return;

    const ent = entities.find((e) => e.entityId === Number(values.entityId));
    if (!ent) return;

    setEntityPrefix(ent.entityName);
    setValues((p) => ({ ...p, defineEntity: ent.entityType }));
  }, [values.entityId, entities]);

  /* -------------------- VALIDATION -------------------- */

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!values.accountName) e.accountName = "Required";
    if (!values.line1) e.line1 = "Required";
    if (!values.city) e.city = "Required";
    if (!values.state) e.state = "Required";
    if (!values.pinCode) e.pinCode = "Required";
    return e;
  }, [values]);

  /* -------------------- SUBMIT -------------------- */

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      setIsSubmitting(false);
      return;
    }
    console.log(entityEnumCase);

    // 🚨 Restricted entity logic
    
    if (RESTRICTED_ENUM_CASES.includes(entityEnumCase)) {
      if (existingSystemCount < 6) {
        setShowConfirm(true);
        setIsSubmitting(false);
        return;
      }

      // force Transaction account
      values.accountType = "Transaction";
    }

    try {
      const res = initialData
        ? await updateAccount(initialData.accountId, values)
        : await createAccount(values);

      if (!res.success) throw new Error();

      toast({ title: "Account saved", variant: "success" });
      onSave();
      onClose();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    values,
    validate,
    initialData,
    entityEnumCase,
    existingSystemCount,
    onSave,
    onClose,
  ]);

  /* -------------------- FIELDS -------------------- */

  const fields: FormFieldConfig<Account>[] = [
    {
      name: "entityId",
      label: "Entity",
      type: "select",
      options: entities.map((e) => ({
        label: e.entityName,
        value: e.entityId,
      })),
    },
    { name: "defineEntity", label: "Define Entity", type: "text", disabled: true },
    {
      name: "accountType",
      label: "Account Type",
      type: "select",
      options: accountTypeOpt.map((a) => ({
        label: a.value,
        value: a.value,
      })),
    },
    { name: "accountName", label: "Account Name", type: "text", required: true },
    { name: "line1", label: "Address Line 1", type: "text", required: true },
    { name: "city", label: "City", type: "text", required: true },
    { name: "state", label: "State", type: "text", required: true },
    { name: "pinCode", label: "Pin Code", type: "text", required: true },
  ];

  if (!isOpen) return null;

  return (
    <>
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
            onChange={(f, v) =>
              setValues((p) => ({ ...p, [f]: v }))
            }
              layout="grid"
          />
          <FormFooter
            onClose={onClose}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            />
            </div>
        </DialogContent>
      </Dialog>

      {/* -------- CONFIRMATION DIALOG -------- */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <h3 className="text-lg font-semibold">
            Generate system accounts?
          </h3>

          <p className="text-sm text-muted-foreground">
            This entity requires 6 mandatory system accounts.
          </p>

          <label className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              checked={generateSystem}
              onChange={(e) => setGenerateSystem(e.target.checked)}
            />
            Generate system accounts
          </label>

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setShowConfirm(false)}>Cancel</button>

            <button
              disabled={!generateSystem}
              onClick={async () => {
                try {
                  for (const type of SYSTEM_ACCOUNT_TYPES) {
                    await createAccount({
                      ...values,
                      accountType: type,
                      accountName: `${entityPrefix} - ${type}`,
                    });
                  }

                  toast({
                    title: "System accounts created",
                    variant: "success",
                  });

                  setShowConfirm(false);
                  onSave();
                  onClose();
                } catch {
                  toast({
                    title: "Failed to generate system accounts",
                    variant: "destructive",
                  });
                }
              }}
            >
              Confirm
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
