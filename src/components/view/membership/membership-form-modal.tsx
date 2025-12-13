import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import { createMembership, updateMembership } from "@/api/membership.api";
import { getMembershipMasters } from "@/api/membershipMaster.api";
import { getAccounts } from "@/api/account.api";

import type { membership } from "@/types/membership";
import type { MembershipMaster } from "@/types/memberShipMaster";
import type { Account } from "@/types/account";
import type { FormFieldConfig } from "@/components/form-modal/types";
import type { Response } from "@/types/response";

import { toast } from "@/hooks/use-toast";
import { addDays, format } from "date-fns";

type Props = {
  isOpen: boolean;
  initialData?: membership;
  onClose: () => void;
  onSaved: () => void;
};

const empty: membership = {
  membershipId: 0,
  membershipMasterId: 0,
  accountId: 0,

  startDate: format(new Date(), "yyyy-MM-dd"),
  endDate: undefined,
  graceDate: undefined,
  cancelationDate: undefined,

  members: 1,

  totalIssueCharges: 0,
  appDiscount: 0,

  totalFBalance: 0,
  totalCBalance: 0,
  totalSpendComm: 0,

  minDepositeRequiredFBalance: 0,
  minDepositeRequiredCBalance: 0,
  depositeReq: 0,

  giftVouchers: 0,

  status: "active",

  actualFBalance: 0,
  actualCBalance: 0,
  refundedAmount: 0,

  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function MembershipFormModal({
  isOpen,
  initialData,
  onClose,
  onSaved,
}: Props) {
  const [values, setValues] = useState<membership>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [membershipMasterOptions, setMembershipMasterOptions] = useState<
    MembershipMaster[]
  >([]);
  const [accountOptions, setAccountOptions] = useState<Account[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setValues({
        ...initialData,
        startDate: initialData.startDate
          ? format(new Date(initialData.startDate), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
        endDate: initialData.endDate
          ? format(new Date(initialData.endDate), "yyy-MM-dd")
          : undefined,
        graceDate: initialData.graceDate
          ? format(new Date(initialData.graceDate), "yyyy-MM-dd")
          : undefined,
        cancelationDate: initialData.cancelationDate
          ? format(new Date(initialData.cancelationDate), "yyyy-MM-dd")
          : undefined,
      });
    } else {
      setValues({
        ...empty,
        startDate: format(new Date(), "yyyy-MM-dd"),
        createdAt: format(new Date(), "yyyy-MM-dd"),
        updatedAt: format(new Date(), "yyyy-MM-dd"),
      });
    }

    setFieldErrors({});
    setError(null);
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      try {
        const mmRes: Response<MembershipMaster[]> = await getMembershipMasters({
          page: 1,
          limit: 1000,
        });

        const mmRows = mmRes?.data as MembershipMaster[];

        setMembershipMasterOptions(mmRows);

        const accRes: Response<Account[]> = await getAccounts({
          page: 1,
          limit: 1000,
        });
        const accRows = accRes?.data as Account[];
        setAccountOptions(accRows);
      } catch (err) {
        console.error("Failed to load dropdown data", err);
        setMembershipMasterOptions([]);
        setAccountOptions([]);
      }
    };

    load();
  }, [isOpen]);

  const onChange = (
    field: keyof membership,
    value: string | number | boolean | Date
  ) => {
    if (field === "membershipMasterId") {
      const selectedMembership = membershipMasterOptions.find((m) => {
        if (m.membershipMasterId == Number(value)) return m;
      });
      setValues((prev) => ({
        ...prev,
        endDate: format(
          addDays(prev.startDate, Number(selectedMembership?.durationDays)),
          "yyyy-MM-dd"
        ),
        graceDate: format(
          addDays(
            prev.startDate,
            Number(selectedMembership?.durationDays) +
              Number(selectedMembership?.graceDays)
          ),
          "yyyy-MM-dd"
        ),
      }));
    }

    setValues((prev) => ({
      ...prev,
      [field]:
        field === "membershipMasterId" || field === "accountId"
          ? Number(value)
          : value,
    }));

    setFieldErrors((prev) => {
      if (!prev[field as string]) return prev;
      const copy = { ...prev };
      delete copy[field as string];
      return copy;
    });
  };

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};

    if (!values.membershipMasterId)
      errs.membershipMasterId = "Membership Master is required";

    if (!values.accountId) errs.accountId = "Account is required";

    if (!values.startDate) errs.startDate = "Start date is required";

    if (!values.status) errs.status = "Status is required";

    return errs;
  }, [values]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload: Partial<membership> = {
        membershipMasterId: values.membershipMasterId,
        accountId: values.accountId,
        startDate: values.startDate,
        endDate: values.endDate,
        graceDate: values.graceDate,
        cancelationDate: values.cancelationDate,

        members: values.members,
        totalIssueCharges: values.totalIssueCharges,
        appDiscount: values.appDiscount,

        totalFBalance: values.totalFBalance,
        totalCBalance: values.totalCBalance,
        totalSpendComm: values.totalSpendComm,

        minDepositeRequiredFBalance: values.minDepositeRequiredFBalance,
        minDepositeRequiredCBalance: values.minDepositeRequiredCBalance,
        depositeReq: values.depositeReq,

        giftVouchers: values.giftVouchers,
        status: values.status,
      };

      if (initialData?.membershipId) {
        await updateMembership(initialData.membershipId, payload);
        toast({ title: "Success", description: "Membership updated" });
      } else {
        await createMembership(payload as membership);
        toast({ title: "Success", description: "Membership created" });
      }

      onSaved();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, initialData, onSaved, onClose]);

  const fields: FormFieldConfig<membership>[] = [
    {
      name: "membershipMasterId",
      label: "Membership Master",
      type: "select",
      options: membershipMasterOptions.map((m) => ({
        value: m.membershipMasterId,
        label: m.membershipType,
      })),
      required: true,
    },
    {
      name: "accountId",
      label: "Account",
      type: "select",
      options: accountOptions.map((a) => ({
        value: a.accountId,
        label: a.name,
      })),
      required: true,
    },
    { name: "startDate", label: "Start Date", type: "Date", required: true },
    { name: "endDate", label: "End Date", type: "Date", disabled: true },
    { name: "graceDate", label: "Grace Date", type: "Date" },

    { name: "members", label: "Members", type: "number" },

    { name: "totalIssueCharges", label: "Issue Charges", type: "number" },
    { name: "appDiscount", label: "App Discount", type: "number" },

    { name: "totalFBalance", label: "Total Food Balance", type: "number" },
    { name: "totalCBalance", label: "Total Credit Balance", type: "number" },
    {
      name: "totalSpendComm",
      label: "Total Spent",
      type: "number",
      disabled: true,
    },

    {
      name: "minDepositeRequiredFBalance",
      label: "Min Deposit (Food)",
      type: "number",
    },
    {
      name: "minDepositeRequiredCBalance",
      label: "Min Deposit (Credit)",
      type: "number",
    },
    { name: "depositeReq", label: "Deposit Required", type: "number" },

    { name: "giftVouchers", label: "Gift Vouchers", type: "number" },

    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
    {
      name: "cancelationDate",
      label: "Cancellation Date",
      type: "Date",
    },
  ];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
        <div className="flex flex-col max-h-[90vh] overflow-hidden">
          <FormHeader
            title={
              initialData?.membershipId ? "Edit Membership" : "Add Membership"
            }
            onClose={onClose}
          />

          {error && (
            <div className="p-3 text-sm bg-red-50 text-red-600">{error}</div>
          )}

          <FormContent
            fields={fields}
            values={values}
            errors={fieldErrors}
            onChange={onChange as any}
            layout="grid"
            loading={false}
            isSubmitting={isSubmitting}
          />

          <FormFooter
            onClose={onClose}
            onSubmit={handleSubmit}
            submitLabel={initialData ? "Update" : "Create"}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
