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
  accountId: null,
  startDate: format(new Date(), "yyyy-MM-dd"),
  endDate: undefined,
  graceDate: undefined,
  cancelationDate: undefined,
  members: 1,
  totalIssueCharges: 0,
  appDiscount: 0,
  totalFBalance: 0,
  totalCBalance: 0,
  totalSpentCa: 0,
  caDepositPRRequiredFBalance: 0,
  caDepositPRRequiredCBalance: 0,
  depositeReq: 0,
  vBalPrInCa: 0,
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

  const [selectedMembership, setSelectedMembership] =
    useState<MembershipMaster>();

  const [debouncedMembers, setDebouncedMembers] = useState<number>(
    initialData?.members || 1
  );

  const [membershipMasterOptions, setMembershipMasterOptions] = useState<
    MembershipMaster[]
  >([]);

  const [membershipMasterPage, setMembershipMasterPage] = useState(1);
  const [hasMoreMembershipMaster, setHasMembershipMaster] = useState(true);
  const [loadingMembershipMaster, setLoadingMembershipMaster] = useState(false);
  const [accountOptions, setAccountOptions] = useState<Account[]>([]);

  const [accountPage, setaccountPage] = useState(1);
  const [hasMoreAccount, setHasMoreAccount] = useState(true);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setValues({
        ...initialData,
        startDate: initialData.startDate
          ? format(new Date(initialData.startDate), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
        endDate: initialData.endDate
          ? format(new Date(initialData.endDate), "yyyy-MM-dd")
          : undefined,
        graceDate: initialData.graceDate
          ? format(new Date(initialData.graceDate), "yyyy-MM-dd")
          : undefined,
        cancelationDate: initialData.cancelationDate
          ? format(new Date(initialData.cancelationDate), "yyyy-MM-dd")
          : undefined,
      });
      setDebouncedMembers(initialData.members || 1);
    } else {
      setValues({
        ...empty,
        startDate: format(new Date(), "yyyy-MM-dd"),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setDebouncedMembers(1);
    }

    setFieldErrors({});
    setError(null);
  }, [isOpen, initialData]);

  const fetchMembershipMaster = useCallback(
    async (isInitial = false) => {
      if (loadingMembershipMaster || (!hasMoreMembershipMaster && !isInitial))
        return;
      setLoadingMembershipMaster(true);
      try {
        const page = isInitial ? 1 : membershipMasterPage;
        const response: Response<MembershipMaster[]> =
          await getMembershipMasters({
            limit: PAGE_SIZE,
            page,
          });
        const items = response?.data || ([] as MembershipMaster[]);
        setMembershipMasterOptions((prev) =>
          isInitial ? items : [...prev, ...items]
        );
        setHasMembershipMaster(items.length === PAGE_SIZE);
        setMembershipMasterPage(page + 1);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch members",
          variant: "destructive",
        });
      } finally {
        setLoadingMembershipMaster(false);
      }
    },
    [loadingMembershipMaster, hasMoreMembershipMaster, membershipMasterPage]
  );

  const fetchAccount = useCallback(
    async (isInitial = false) => {
      if (loadingAccount || (!hasMoreAccount && !isInitial)) return;
      setLoadingMembershipMaster(true);
      try {
        const page = isInitial ? 1 : accountPage;
        const response: Response<Account[]> = await getAccounts({
          limit: PAGE_SIZE,
          page,
        });
        const items = response?.data || ([] as Account[]);
        setAccountOptions((prev) => (isInitial ? items : [...prev, ...items]));
        setHasMoreAccount(items.length === PAGE_SIZE);
        setaccountPage(page + 1);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch members",
          variant: "destructive",
        });
      } finally {
        setLoadingAccount(false);
      }
    },
    [loadingAccount, hasMoreAccount, accountPage]
  );

  useEffect(() => {
    if (!isOpen) return;

    fetchMembershipMaster();
    fetchAccount();
  }, [isOpen, initialData]);

  // 3. Debounce Effect for Members Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMembers(Number(values.members));
    }, 600);

    return () => {
      clearTimeout(handler);
    };
  }, [values.members]);

  // 4. Calculations Effect (Runs when debounced members or selected master changes)
  useEffect(() => {
    if (!debouncedMembers || !selectedMembership) return;

    const members = Number(debouncedMembers);

    /* 1. Total Issue Charge */
    const perMemberRegCharge = Number(
      selectedMembership.perMemberRegCharge ?? 0
    );
    const perMemberPerMonthCharge = Number(
      selectedMembership.caPerMemberPerMonth ?? 0
    );
    const totalIssueCharges = Math.max(
      perMemberRegCharge * members,
      selectedMembership.minIssueCharge
    );

    /* 2. Applicable Discount */
    const memberLimit = Number(selectedMembership.disOnCaUptoMembers);
    const discountPerMember =
      Number(selectedMembership.descreaseCaByPercentage ?? 0) / 100;

    let applicableMembers;
    if (members === 1) {
      applicableMembers = 1;
    } else {
      applicableMembers = Math.min(members, memberLimit);
    }

    const appDisc =
      applicableMembers === 1
        ? 1
        : 1 - (applicableMembers - 1) * discountPerMember;

    /* 3. Total Spent (Intermediate) */
    const durationMultiplier = Math.floor(
      Number(selectedMembership.durationDays ?? 0) / 30
    );

    const intermediate = Number(
      (
        appDisc *
        perMemberPerMonthCharge *
        durationMultiplier *
        members
      ).toFixed(2)
    );

    /* 4. Total F Balance */
    const fBalPrInCa = (selectedMembership?.fBalPrInCa as number) / 100;
    const tfBal = Math.floor((intermediate * fBalPrInCa) / 100) * 100;

    /* 5. Total C Balance */
    const cBalPrInCa = selectedMembership.cBalPrInCa / 100;
    const tcBal = Math.floor((intermediate * cBalPrInCa) / 100) * 100;

    /* 6. Total Spent */
    const totalSpent = tfBal + tcBal;

    /* 7. Min Deposit F Balance Required */
    const minDepositRate = Number(selectedMembership.caDepositPR ?? 0) / 100;
    const minDepositFBalanceReq = Math.floor(tfBal * minDepositRate);

    /* 8. Min Deposit C Balance Required */
    const minDepositCBalanceReq = Math.floor(tcBal * minDepositRate);

    /* 9. Total Deposit Required */
    const depositReq = totalSpent + totalIssueCharges;

    /* 10. Gift Vouchers */
    const vBalPrInCas =
      Math.ceil(
        ((totalSpent / 100) * Number(selectedMembership?.vBalPrInCa)) / 100
      ) * 100;

    setValues((prev) => ({
      ...prev,
      totalIssueCharges: totalIssueCharges,
      appDiscount: appDisc,
      totalSpentCa: totalSpent,
      totalFBalance: tfBal,
      totalCBalance: tcBal,
      caDepositPRRequiredFBalance: minDepositFBalanceReq,
      caDepositPRRequiredCBalance: minDepositCBalanceReq,
      depositeReq: depositReq,
      vBalPrInCas: vBalPrInCas,
    }));
  }, [debouncedMembers, selectedMembership]);
  const onChange = (
    field: keyof membership,
    value: string | number | boolean | Date
  ) => {
    if (field === "membershipMasterId") {
      const selected = membershipMasterOptions.find((m) => {
        return m.membershipMasterId === Number(value);
      });

      setSelectedMembership(selected);

      setValues((prev) => ({
        ...prev,
        membershipMasterId: Number(value),
        endDate: format(
          addDays(prev.startDate, Number(selected?.durationDays || 0)),
          "yyyy-MM-dd"
        ),
        graceDate: format(
          addDays(
            prev.startDate,
            Number(selected?.durationDays || 0) +
              Number(selected?.graceDays || 0)
          ),
          "yyyy-MM-dd"
        ),
      }));

      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[field as string];
        return copy;
      });
      return;
    }

    if (field === "startDate") {
      const newStartDate = new Date(value as string);

      setValues((prev) => {
        const updates: Partial<membership> = { [field as string]: value };

        if (selectedMembership) {
          updates.endDate = format(
            addDays(newStartDate, Number(selectedMembership.durationDays || 0)),
            "yyyy-MM-dd"
          );
          updates.graceDate = format(
            addDays(
              newStartDate,
              Number(selectedMembership.durationDays || 0) +
                Number(selectedMembership.graceDays || 0)
            ),
            "yyyy-MM-dd"
          );
        }
        return { ...prev, ...updates };
      });

      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[field as string];
        return copy;
      });
      return;
    }

    setValues((prev) => ({
      ...prev,
      [field]: field === "accountId" ? Number(value) : value,
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
        accountId: values.accountId ?? null,
        startDate: values.startDate,
        endDate: values.endDate,
        graceDate: values.graceDate,
        cancelationDate: values.cancelationDate,

        members: Number(values.members),
        totalIssueCharges: Number(values.totalIssueCharges),
        appDiscount: Number(values.appDiscount),

        totalFBalance: Number(values.totalFBalance),
        totalCBalance: Number(values.totalCBalance),
        totalSpentCa: Number(values.totalSpentCa),

        caDepositPRRequiredFBalance: Number(values.caDepositPRRequiredFBalance),
        caDepositPRRequiredCBalance: Number(values.caDepositPRRequiredCBalance),
        depositeReq: Number(values.depositeReq),

        qualifyingRecieptNo: Number(values.qualifyingRecieptNo),
        refundPaymentNo: Number(values.refundPaymentNo),

        vBalPrInCa: Number(values.vBalPrInCa),
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
    { name: "graceDate", label: "Grace Date", type: "Date", disabled: true },

    { name: "members", label: "Members", type: "number" },

    { name: "totalIssueCharges", label: "Issue Charges", type: "number" },
    { name: "appDiscount", label: "App Discount", type: "number" },

    { name: "totalFBalance", label: "Total F Balance", type: "number" },
    { name: "totalCBalance", label: "Total Credit Balance", type: "number" },
    {
      name: "totalSpentCa",
      label: "Total Spent",
      type: "number",
      disabled: true,
    },

    {
      name: "caDepositPRRequiredFBalance",
      label: "Min Deposit (F)",
      type: "number",
    },
    {
      name: "caDepositPRRequiredCBalance",
      label: "Min Deposit (Credit)",
      type: "number",
    },
    { name: "depositeReq", label: "Deposit Required", type: "number" },

    { name: "vBalPrInCa", label: "Gift Vouchers", type: "number" },

    {
      name: "qualifyingRecieptNo",
      label: "Qualifying RecieptNo",
      type: "number",
    },

    { name: "refundPaymentNo", label: "refund Payment Number", type: "number" },

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
            error={""}
            errors={fieldErrors}
            onChange={onChange}
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
