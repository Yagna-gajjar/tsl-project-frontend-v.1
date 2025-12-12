import { useCallback, useEffect, useRef, useState } from "react";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import { createMembership, updateMembership } from "@/api/membership.api";
import { getFamilies } from "@/api/family.api";
import { getMembershipMasters } from "@/api/membershipMaster.api";
import type { membership } from "@/types/membership";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";
import { format } from "date-fns";
import type { FormFieldConfig } from "@/components/form-modal/types";
import type { membershipMaster } from "@/types/memberShipMaster";
import type { Family } from "@/types/family";

type SelectOption = { value: number | string; label: string };

type Props = {
  isOpen: boolean;
  initialData?: membership;
  onClose: () => void;
  onSaved: () => void;
};

const empty: membership = {
  membershipId: 0,
  membershipMasterId: 0,
  familyId: 0,
  startDate: new Date(),
  endDate: new Date(),
  graceDate: new Date(),
  committedAmount: 0,
  issueCharge: 0,
  minVBalance: 0,
  minFBalance: 0,
  minCBalance: 0,
  paymentId: "",
  status: "active",
  cancellationDate: undefined as unknown as Date,
  actualFBalance: 0,
  actualCBalance: 0,
  refundedAmount: 0,
  refundedPaymentId: 0,
  cancellationCharges: 0,
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

  const [familyOptions, setFamilyOptions] = useState<SelectOption[]>([]);
  const [membershipMasterOptions, setMembershipMasterOptions] = useState<
    SelectOption[]
  >([]);
  const [membershipMastersMap, setMembershipMastersMap] = useState<
    Record<number, any>
  >({});

  const baseMinTotalRef = useRef<number>(0);
  const durationDaysRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      const init = {
        ...initialData,
        startDate: initialData.startDate
          ? new Date(initialData.startDate)
          : undefined,
        endDate: initialData.endDate
          ? new Date(initialData.endDate)
          : undefined,
        graceDate: initialData.graceDate
          ? new Date(initialData.graceDate)
          : undefined,
        cancellationDate: initialData.cancellationDate
          ? new Date(initialData.cancellationDate)
          : undefined,
        createdAt: initialData.createdAt
          ? new Date(initialData.createdAt)
          : new Date(),
        updatedAt: initialData.updatedAt
          ? new Date(initialData.updatedAt)
          : new Date(),
      } as membership;

      baseMinTotalRef.current =
        Number(init.minFBalance || 0) + Number(init.minCBalance || 0);

      init.actualFBalance = Number(init.minFBalance || 0);
      init.actualCBalance = Number(init.minCBalance || 0);
      init.committedAmount =
        Number(init.minFBalance || 0) + Number(init.minCBalance || 0);

      setValues(init);
    } else {
      const v = {
        ...empty,
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      baseMinTotalRef.current = Number(v.minFBalance) + Number(v.minCBalance);
      v.actualFBalance = v.minFBalance;
      v.actualCBalance = v.minCBalance;
      v.committedAmount = v.minFBalance + v.minCBalance;
      setValues(v);
    }

    setFieldErrors({});
    setError(null);
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const load = async () => {
      try {
        const famRes: Response = await getFamilies({ page: 1, limit: 1000 });
        const famRows = Array.isArray(famRes)
          ? famRes
          : Array.isArray(famRes?.data)
            ? famRes.data
            : [];
        const famOpts: SelectOption[] = famRows.map((f: Family) => ({
          value: f.familyId as number,
          label: f.familyName
            ? `${f.familyName} (${f.familyId})`
            : String(f.familyId),
        }));

        const mmRes: Response<membershipMaster[]> = await getMembershipMasters({
          page: 1,
          limit: 1000,
        });
        const mmRows = Array.isArray(mmRes)
          ? mmRes
          : Array.isArray(mmRes?.data)
            ? mmRes.data
            : [];
        const mmOpts: SelectOption[] = mmRows.map((m: membershipMaster) => ({
          value: m.membershipMasterId as number,
          label: m.membershipType
            ? `${m.membershipType} (${m.membershipMasterId})`
            : String(m.membershipMasterId),
        }));

        const mmMap: Record<number, any> = {};
        mmRows.forEach((m: membershipMaster) => {
          if (m && m.membershipMasterId != null) {
            mmMap[Number(m.membershipMasterId)] = m;
          }
        });

        if (!mounted) return;
        setFamilyOptions(famOpts);
        setMembershipMasterOptions(mmOpts);
        setMembershipMastersMap(mmMap);

        if (
          initialData?.membershipMasterId &&
          mmMap[Number(initialData.membershipMasterId)]
        ) {
          const mm = mmMap[Number(initialData.membershipMasterId)];

          const minF =
            mm.minFBalance !== undefined ? Number(mm.minFBalance) : undefined;
          const minC =
            mm.minCBalance !== undefined ? Number(mm.minCBalance) : undefined;

          const total =
            (minF ?? values.minFBalance) + (minC ?? values.minCBalance);
          baseMinTotalRef.current = total;

          setValues((prev) => ({
            ...prev,
            minFBalance: minF !== undefined ? minF : prev.minFBalance,
            minCBalance: minC !== undefined ? minC : prev.minCBalance,
            actualFBalance: minF !== undefined ? minF : prev.actualFBalance,
            actualCBalance: minC !== undefined ? minC : prev.actualCBalance,
            minVBalance:
              mm.minVBalance !== undefined
                ? Number(mm.minVBalance)
                : prev.minVBalance,
            issueCharge:
              mm.issueCharge !== undefined
                ? Number(mm.issueCharge)
                : prev.issueCharge,
            committedAmount:
              (minF !== undefined ? minF : prev.minFBalance) +
              (minC !== undefined ? minC : prev.minCBalance),
            cancellationCharges:
              mm.cancellationCharges !== undefined
                ? Number(mm.cancellationCharges)
                : prev.cancellationCharges,
          }));

          if (
            mm.membershipDurationInDays !== undefined &&
            mm.membershipDurationInDays !== null
          ) {
            durationDaysRef.current = Number(mm.membershipDurationInDays);
            if (values.startDate) {
              const end = new Date(values.startDate);
              end.setDate(end.getDate() + Number(mm.membershipDurationInDays));
              setValues((p) => ({ ...p, endDate: end } as membership));
            }
          }
        }
      } catch (err) {
        console.error(
          "Failed to load family or membership master options",
          err
        );
        if (!mounted) return;
        setFamilyOptions([]);
        setMembershipMasterOptions([]);
        setMembershipMastersMap({});
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [isOpen, initialData]);

  useEffect(() => {
    const mmId = Number(values.membershipMasterId);
    if (mmId && membershipMastersMap && membershipMastersMap[mmId]) {
      const mm = membershipMastersMap[mmId];

      const minF =
        mm.minFBalance !== undefined ? Number(mm.minFBalance) : undefined;
      const minC =
        mm.minCBalance !== undefined ? Number(mm.minCBalance) : undefined;

      const total = (minF ?? values.minFBalance) + (minC ?? values.minCBalance);
      baseMinTotalRef.current = total;

      setValues((prev) => ({
        ...prev,
        minFBalance: minF !== undefined ? minF : prev.minFBalance,
        minCBalance: minC !== undefined ? minC : prev.minCBalance,
        actualFBalance: minF !== undefined ? minF : prev.actualFBalance,
        actualCBalance: minC !== undefined ? minC : prev.actualCBalance,
        minVBalance:
          mm.minVBalance !== undefined
            ? Number(mm.minVBalance)
            : prev.minVBalance,
        issueCharge:
          mm.issueCharge !== undefined
            ? Number(mm.issueCharge)
            : prev.issueCharge,
        committedAmount:
          (minF !== undefined ? minF : prev.minFBalance) +
          (minC !== undefined ? minC : prev.minCBalance),
        cancellationCharges:
          mm.cancellationCharges !== undefined
            ? Number(mm.cancellationCharges)
            : prev.cancellationCharges,
      }));
    }
  }, [values.membershipMasterId, membershipMastersMap]);

  useEffect(() => {
    const sd = values.startDate ? new Date(values.startDate) : null;
    const dur = durationDaysRef.current;
    if (sd && typeof dur === "number" && !isNaN(dur)) {
      const end = new Date(sd);
      end.setDate(end.getDate() + Number(dur));
      setValues((p) => ({ ...p, endDate: end } as membership));
    }
  }, [values.startDate]);

  const onChange = (
    field: keyof membership,
    val: string | number | boolean | Date
  ) => {
    if (field === "minFBalance") {
      const newMinF = typeof val === "string" ? Number(val) : Number(val);
      const prevMinF = Number(values.minFBalance || 0);
      const prevMinC = Number(values.minCBalance || 0);

      const total = prevMinF + prevMinC || baseMinTotalRef.current || 0;

      const newMinC = total - newMinF;

      baseMinTotalRef.current = total;

      setValues(
        (p) =>
        ({
          ...p,
          minFBalance: newMinF,
          minCBalance: newMinC,
          committedAmount: newMinF + newMinC,
          actualFBalance: newMinF,
          actualCBalance: newMinC,
        } as membership)
      );

      setFieldErrors((prev) => {
        if (!prev[field as string]) return prev;
        const copy = { ...prev };
        delete copy[field as string];
        return copy;
      });

      return;
    }

    if (field === "startDate") {
      const mmId = Number(values.membershipMasterId);
      const mm = membershipMastersMap[mmId];

      if (mm.membershipDurationInDays == null) {
        console.error("Duration is missing or invalid.");
        durationDaysRef.current = null;
        return;
      }

      const duration = Number(mm.membershipDurationInDays);
      if (!values.startDate) {
        console.error("Start date is missing.");
        return;
      }

      const startDate = new Date(values.startDate);
      if (isNaN(startDate.getTime())) {
        console.error("Invalid start date:", values.startDate);
        return;
      }

      const end = new Date(startDate);
      end.setDate(startDate.getDate() + duration);

      setValues((p) => ({
        ...p,
        endDate: format(end, "yyyy-MM-dd") as any,
      }));

    }

    const normalized =
      field === "familyId" ||
        field === "membershipMasterId" ||
        field === "refundedPaymentId"
        ? typeof val === "string"
          ? Number(val)
          : val
        : val;

    setValues((p) => ({ ...p, [field]: normalized } as membership));
    setFieldErrors((prev) => {
      if (!prev[field as string]) return prev;
      const copy = { ...prev };
      delete copy[field as string];
      return copy;
    });
  };

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!values.membershipMasterId || Number(values.membershipMasterId) === 0) {
      errs.membershipMasterId = "Membership master is required";
    }
    if (!values.familyId || Number(values.familyId) === 0) {
      errs.familyId = "Family is required";
    }
    if (!values.startDate) {
      errs.startDate = "Start date is required";
    }
    if (!values.status || String(values.status).trim() === "") {
      errs.status = "Status is required";
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
      const payload: Partial<membership> = {
        membershipMasterId: Number(values.membershipMasterId),
        familyId: Number(values.familyId),
        startDate: values.startDate,
        endDate: values.endDate,
        graceDate: values.graceDate,
        committedAmount: Number(values.committedAmount),
        issueCharge: Number(values.issueCharge),
        minVBalance: Number(values.minVBalance),
        minFBalance: Number(values.minFBalance),
        minCBalance: Number(values.minCBalance),
        paymentId: String(values.paymentId || ""),
        status: String(values.status),
        cancellationDate: values.cancellationDate || undefined,
        actualFBalance: Number(values.actualFBalance),
        actualCBalance: Number(values.actualCBalance),
        refundedAmount: Number(values.refundedAmount),
        refundedPaymentId: Number(values.refundedPaymentId),
        cancellationCharges: Number(values.cancellationCharges),
      };

      if (initialData?.membershipId) {
        await updateMembership(
          initialData.membershipId,
          payload as Partial<
            Omit<membership, "membershipId" | "createdAt" | "updatedAt">
          >
        );
        toast({
          title: "Success",
          description: "Membership updated successfully",
        });
      } else {
        await createMembership(
          payload as Omit<
            membership,
            "membershipId" | "createdAt" | "updatedAt"
          >
        );
        toast({
          title: "Success",
          description: "Membership created successfully",
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, values, initialData, onSaved, onClose]);

  const fields: FormFieldConfig<membership>[] = [
    {
      name: "membershipMasterId",
      label: "Membership Master",
      type: "select",
      options: membershipMasterOptions,
      required: true,
    },
    {
      name: "familyId",
      label: "Family",
      type: "select",
      options: familyOptions,
      required: true,
    },
    { name: "startDate", label: "Start Date", type: "Date", required: true },
    {
      name: "endDate",
      label: "End Date",
      type: "Date",
      required: false,
      disabled: true,
    },
    { name: "graceDate", label: "Grace Date", type: "Date", required: false },
    {
      name: "committedAmount",
      label: "Committed Amount",
      type: "number",
      required: false,
      disabled: true,
    },
    {
      name: "issueCharge",
      label: "Issue Charges",
      type: "number",
      required: false,
    },
    {
      name: "minVBalance",
      label: "Min V Balance",
      type: "number",
      required: false,
    },
    {
      name: "minFBalance",
      label: "Min F Balance",
      type: "number",
      required: false,
    },
    {
      name: "minCBalance",
      label: "Min C Balance",
      type: "number",
      required: false,
      disabled: true,
    },
    { name: "paymentId", label: "Payment ID", type: "text", required: false },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Cancelled", value: "cancelled" },
      ],
      required: true,
    },
    {
      name: "cancellationDate",
      label: "Cancellation Date",
      type: "date",
      required: false,
    },
    {
      name: "cancellationCharges",
      label: "Cancellation Charges",
      type: "number",
      required: false,
      disabled: false,
    },
    {
      name: "actualFBalance",
      label: "Actual F Balance",
      type: "number",
      required: false,
      disabled: true,
    },
    {
      name: "actualCBalance",
      label: "Actual C Balance",
      type: "number",
      required: false,
      disabled: true,
    },
    {
      name: "refundedAmount",
      label: "Refunded Amount",
      type: "number",
      required: false,
    },
    {
      name: "refundedPaymentId",
      label: "Refunded Payment ID",
      type: "number",
      required: false,
    },
  ];

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-3xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
        <div className="flex flex-col max-h-[90vh] overflow-hidden">
          <FormHeader
            title={
              initialData?.membershipId ? "Edit Membership" : "Add Membership"
            }
            onClose={onClose}
          />
          <div className="overflow-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}
            <FormContent
              fields={fields}
              values={values}
              errors={fieldErrors}
              loading={false}
              error={error}
              isSubmitting={isSubmitting}
              onChange={
                onChange as (
                  field: keyof membership,
                  value: string | number | boolean
                ) => void
              }
              layout="grid"
            />
          </div>
          <FormFooter
            onClose={onClose}
            onSubmit={handleSubmit}
            submitLabel={initialData?.membershipId ? "Update" : "Create"}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
