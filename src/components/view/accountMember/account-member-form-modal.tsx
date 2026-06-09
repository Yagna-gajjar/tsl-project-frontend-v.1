import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import {
  createAccountMember,
  updateAccountMember,
} from "@/api/accountMember.api";
import { getMembers } from "@/api/member.api";
import { getAccounts } from "@/api/account.api";

import type { AccountMember } from "@/types/accountMember";
import type { FormFieldConfig } from "@/components/form-modal/types";
import type { Response } from "@/types/response";
import type { Member } from "@/types/member";
import type { Account } from "@/types/account";

import { toast } from "@/hooks/use-toast";

type Props = {
  isOpen: boolean;
  initialData?: AccountMember;
  onClose: () => void;
  onSaved: () => void;
};

export default function AccountMemberFormModal({
  isOpen,
  initialData,
  onClose,
  onSaved,
}: Props) {
  const [values, setValues] = useState<AccountMember>({
    accountMemberId: 0,
    memberId: 0,
    accountId: 0,
    relationship: "",
    linkBilling: false,
    linkDate: new Date(),
    dlinkDate: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorityId: undefined
  });

  const [memberOptions, setMemberOptions] = useState<Member[]>([]);
  const [accountOptions, setAccountOptions] = useState<Account[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setValues({
        ...initialData,
        linkDate: initialData.linkDate
          ? new Date(initialData.linkDate)
          : new Date(),
        dlinkDate: initialData.dlinkDate
          ? new Date(initialData.dlinkDate)
          : undefined,
      });
    } else {
      setValues({
        accountMemberId: 0,
        memberId: 0,
        accountId: 0,
        relationship: "",
        linkBilling: false,
        linkDate: new Date(),
        dlinkDate: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        authorityId: undefined
      });
    }

    setFieldErrors({});
    setError(null);

    const fetchMemberAccount = async () => {
      try {
        const resMember: Response<Member[]> = await getMembers({
          page: 1,
          limit: 1000,
        });

        setMemberOptions(Array.isArray(resMember?.data) ? resMember.data : []);

        const resAccount: Response<Account[]> = await getAccounts({
          page: 1,
          limit: 1000,
        });
        setAccountOptions(
          Array.isArray(resAccount?.data) ? resAccount.data : []
        );
      } catch (err) {
        console.error("Failed to load members/accounts", err);
        setMemberOptions([]);
        setAccountOptions([]);
      }
    };

    fetchMemberAccount();
  }, [isOpen, initialData]);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!values.memberId) errs.memberId = "Member is required";
    if (!values.accountId) errs.accountId = "Account is required";
    if (!values.relationship.trim())
      errs.relationship = "Relationship is required";

    return errs;
  };

  const submit = async () => {
    setIsSubmitting(true);
    setError(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setIsSubmitting(false);
      return;
    }

    try {
      if (initialData?.accountMemberId) {
        await updateAccountMember(initialData.accountMemberId, values);
      } else {
        await createAccountMember(
          values as Omit<
            AccountMember,
            "accountMemberId" | "createdAt" | "updatedAt"
          >
        );
      }

      toast({ title: "Saved successfully" });
      onSaved();
      onClose();
    } catch {
      setError("Failed to save account member");
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = useMemo<FormFieldConfig<AccountMember>[]>(() => [
    {
      name: "memberId",
      label: "Member",
      type: "select",
      options: memberOptions?.map((m) => ({
        value: m.memberId,
        label: `${m.memberFirstName ?? ""} ${m.memberLastName ?? ""}`.trim(),
      })),
      required: true,
    },
    {
      name: "accountId",
      label: "Account",
      type: "select",
      options: accountOptions?.map((a) => ({
        value: a.accountId,
        label: a.accountName ?? `Account ${a.accountId}`,
      })),
      required: true,
    },
    {
      name: "relationship",
      label: "Relationship",
      type: "text",
      required: true,
    },
    {
      name: "linkBilling",
      label: "Link Billing",
      type: "checkbox",
    },
    {
      name: "linkDate",
      label: "Link Date",
      type: "Date",
    },
    {
      name: "dlinkDate",
      label: "Delink Date",
      type: "Date",
    },
  ], [memberOptions, accountOptions]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
        <div className="flex flex-col max-h-[90vh] overflow-hidden">
          <FormHeader
            title={initialData ? "Edit Account Member" : "Add Account Member"}
            onClose={onClose}
          />

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50">{error}</div>
          )}

          <FormContent
            fields={fields}
            values={values}
            errors={fieldErrors}
            loading={false}
            error={error}
            isSubmitting={isSubmitting}
            onChange={(f, v) =>
              setValues((p) => ({ ...p, [f]: v } as AccountMember))
            }
            layout="grid"
          />

          <FormFooter
            onClose={onClose}
            onSubmit={submit}
            submitLabel={initialData ? "Update" : "Create"}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
