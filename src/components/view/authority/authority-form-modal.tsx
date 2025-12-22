import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import type { Authority } from "@/types/authority";
import type { Account } from "@/types/account";
import type { AccountMember } from "@/types/accountMember";
import type { FormFieldConfig } from "@/components/form-modal/types";
import type { Response } from "@/types/response";

import { getAccounts } from "@/api/account.api";
import { getAccountMembers } from "@/api/accountMember.api";
import { createAuthority, updateAuthority } from "@/api/authority.api";

import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Props = {
  isOpen: boolean;
  initialData?: Authority;
  onClose: () => void;
  onSave: () => void;
};

const empty: Authority = {
  memberId: 0,
  accountId: 0,
  linkingDate: format(new Date(), "yyyy-MM-dd"),
  level: 1,
};

export default function AuthorityFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<Authority>(empty);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [members, setMembers] = useState<AccountMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) setValues(initialData);
    else setValues(empty);
  }, [initialData, isOpen]);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res: Response<Account[]> = await getAccounts({ limit: 500 });
        setAccounts(res.data ?? []);
      } catch {
        setAccounts([]);
      }
    };
    loadAccounts();
  }, []);

  useEffect(() => {
    const loadMembers = async () => {
      if (!values.accountId) {
        setMembers([]);
        return;
      }

      try {
        const res: Response<AccountMember[]> = await getAccountMembers({
          accountId: Number(values.accountId),
          limit: 500,
        });

        setMembers(res.data ?? []);
      } catch {
        setMembers([]);
      }
    };

    loadMembers();
  }, [values.accountId]);

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!values.accountId) e.accountId = "Account required";
    if (!values.memberId) e.memberId = "Member required";
    if (!values.linkingDate) e.linkingDate = "Link date required";
    return e;
  }, [values]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    const errs = validate();

    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...values,
        memberId: Number(values.memberId),
        accountId: Number(values.accountId),
        linkingDate: values.linkingDate
          ? new Date(values.linkingDate)
          : undefined,
      };

      const res = values.authorityId
        ? await updateAuthority(values.authorityId, payload)
        : await createAuthority(payload);

      if (!res.success) throw new Error();

      toast({
        title: values.authorityId ? "Authority updated" : "Authority created",
        variant: "success",
      });

      onSave();
      onClose();
    } catch {
      setError("Failed to save account");
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields: FormFieldConfig<Authority>[] = [
    {
      name: "accountId",
      label: "Account",
      type: "select",
      required: true,
      options: accounts.map((a) => ({
        label: a.accountName,
        value: a.accountId,
      })),
    },
    {
      name: "memberId",
      label: "Member",
      type: "select",
      required: true,
      options: members.map((m) => ({
        label: `${m.memberFirstName} ${m.memberLastName}`,
        value: m.memberId,
      })),
    },
    { name: "linkingDate", label: "Link Date", type: "Date" },
    { name: "level", label: "Level", type: "number" },
  ];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
        <div className="flex flex-col max-h-[70vh] overflow-hidden">
          <FormHeader
            title={values.authorityId ? "Edit Authority" : "Add Authority"}
            onClose={onClose}
          />

          <FormContent
            fields={fields}
            values={values}
            errors={fieldErrors}
            error={error}
            loading={false}
            isSubmitting={isSubmitting}
            onChange={(f, v) => {
              setValues((p) => ({
                ...p,
                [f]: v,
                ...(f === "accountId" ? { memberId: 0 } : {}),
              }));

              setFieldErrors((e) => {
                if (!e[f as string]) return e;
                const c = { ...e };
                delete c[f as string];
                return c;
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
