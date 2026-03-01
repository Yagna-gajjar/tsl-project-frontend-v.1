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
import type { Enums } from "@/types/enums";
import { getEnumsByCategory } from "@/api/enums.api";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";


const SYSTEM_ACCOUNT_TYPES = [
  "Main",
  "Expenses",
  "Deposits",
  "SGST",
  "CGST",
  "Other",
  "Transaction"
] as const;

const RESTRICTED_ENUM_CASES = [4, 5, 6];


const empty: Account = {
  regDate: format(new Date(), "yyyy-MM-dd"),
  entityId: 0,
  accountName: "",
  contact: "",
  proffesionalSector: "",
  adminInstruction: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  country: "India",
  pinCode: "",
  accountType: "Transaction",
};

type Props = {
  isOpen: boolean;
  initialData?: Account;
  onClose: () => void;
  onSave: () => void;
};

export default function AccountFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<Account>(empty);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [entityTypes, setEntityTypes] = useState<Enums[]>([]);
  const [adminInstructionOpt, setAdminInstructionOpt] = useState<Enums[]>([]);
  const [accountTypeOpt, setAccountTypeOpt] = useState<Enums[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [showConfirm, setShowConfirm] = useState(false);
  const [generateSystem, setGenerateSystem] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const loadData = async () => {
      const [entRes, typeRes, adminRes, accTypeRes] = await Promise.all([
        getEntities({ limit: 500 }),
        getEnumsByCategory("ENTITY TYPE"),
        getEnumsByCategory("ADMITINSTRUCTIONS"),
        getEnumsByCategory("ACCOUNTTYPE"),
      ]);

      setEntities(entRes.data ?? []);
      setEntityTypes(typeRes.data ?? []);
      setAdminInstructionOpt(adminRes.data ?? []);
      setAccountTypeOpt(accTypeRes.data ?? []);
    };
    loadData();
  }, [isOpen]);

  useEffect(() => {
    if (initialData) setValues({ ...initialData });
    else setValues(empty);
  }, [initialData]);

  useEffect(() => {
    getSelectedEntityInfo();
  }, [values.entityId])

  const getSelectedEntityInfo = () => {
    const entity = entities.find(e => e.entityId === values.entityId);

    if (!entity) return null;

    const typeEnum = entityTypes.find(t => t.value === entity.entityType);
    return {
      ...entity,
      enumCase: typeEnum ? typeEnum.enumCase : null
    };
  };

  const executeCreation = async (accountData: Account) => {
    const res = initialData
      ? await updateAccount(initialData.accountId!, accountData)
      : await createAccount(accountData);
    if (!res.success) throw new Error();
  };

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setFieldErrors({});

    const e: Record<string, string> = {};
    if (!values.entityId) e.entityId = "Required";
    if (!values.accountName) e.accountName = "Required";
    if (!values.line1) e.line1 = "Required";
    if (!values.city) e.city = "Required";
    if (!values.state) e.state = "Required";
    if (!values.pinCode) e.pinCode = "Required";

    if (Object.keys(e).length) {
      setFieldErrors(e);
      setIsSubmitting(false);
      return;
    }

    const entityInfo = getSelectedEntityInfo();
    const updatedValues = {
      ...values,
      entityType: entityInfo?.entityType,
    };
    const isRestricted = RESTRICTED_ENUM_CASES.includes(entityInfo?.enumCase ?? 0);

    if (isRestricted && !initialData) {
      const existing = await getAccounts({ entityId: updatedValues.entityId });
      const count = existing.data?.length ?? 0;

      if (count === 0) {
        setShowConfirm(true);
        setIsSubmitting(false);
        return;
      } else {
        updatedValues.accountType = "Transaction";
      }
    } else if (!isRestricted) {
      updatedValues.accountType = "Transaction";
    }
    try {
      await executeCreation(updatedValues);
      toast({ title: "Account saved successfully" });
      onSave();
      onClose();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, entities, entityTypes, initialData]);


  const handleGenerateSystemAccounts = async () => {
    const entityInfo = getSelectedEntityInfo();
    setIsSubmitting(true);
    try {
      for (const type of SYSTEM_ACCOUNT_TYPES) {
        await createAccount({
          ...values,
          entityType: entityInfo?.entityType,
          accountType: type,
          accountName: `${entityInfo?.entityName} - ${type}`,
        });
      }
      toast({ title: "6 System accounts created and one transaction account" });
      onSave();
      onClose();
    } catch (err) {
      toast({ title: "Batch creation failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };


  const fields: FormFieldConfig<Account>[] = [
    {
      name: "entityId",
      label: "Entity",
      type: "select",
      options: entities.map((e) => ({ label: e.entityName, value: e.entityId })),
    },
    {
      name: "accountType",
      label: "Account Type",
      type: "select",
      disabled: !!initialData,
      options: accountTypeOpt.map((a) => ({ label: a.value, value: a.value })),
    },
    { name: "accountName", label: "Account Name", type: "text", required: true },
    { name: "contact", label: "Contact No", type: "text" },
    { name: "proffesionalSector", label: "Sector", type: "text" },
    {
      name: "adminInstruction",
      label: "Admin Instruction",
      type: "select",
      options: adminInstructionOpt.map((a) => ({ label: a.value, value: a.value })),
    },
    { name: "line1", label: "Address Line 1", type: "text", required: true },
    { name: "line2", label: "Address Line 2", type: "text" },
    { name: "city", label: "City", type: "text", required: true },
    { name: "state", label: "State", type: "text", required: true },
    { name: "pinCode", label: "Pin Code", type: "text", required: true },
    { name: "country", label: "Country", type: "text" },
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
          <div className="flex flex-col max-h-[90vh] overflow-hidden">
            <FormHeader title={initialData ? "Edit Account" : "Add Account"} onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-6">
              <FormContent
                fields={fields}
                values={values}
                errors={fieldErrors}
                error={null}
                loading={false}
                isSubmitting={isSubmitting}
                onChange={(f, v) => {
                  setValues((p) => ({ ...p, [f]: v }))
                }}
                layout="grid"
              />
            </div>
            <FormFooter onClose={onClose} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <div className="p-4">
            <h3 className="text-lg font-bold">New Entity Detected</h3>
            <p className="text-sm text-gray-500 my-2">
              This entity type requires mandatory system accounts. Would you like to generate the 6 standard accounts (Main, Expenses, etc.) automatically?
            </p>
            <div className="flex items-center space-x-2 my-4">
              <Checkbox
                id="gen"
                checked={generateSystem}
                onCheckedChange={(v) => setGenerateSystem(!!v)}
              />
              <label htmlFor="gen" className="text-sm font-medium">
                Yes, generate system accounts
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button
                disabled={!generateSystem || isSubmitting}
                onClick={handleGenerateSystemAccounts}
              >
                {isSubmitting ? "Creating..." : "Confirm & Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}