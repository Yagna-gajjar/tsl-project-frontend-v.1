// MembershipFormModal.tsx
import { useCallback, useEffect, useState } from "react";
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
  issueCharges: 0,
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

  useEffect(() => {
    if (!isOpen) return;

    // init values
    if (initialData) {
      setValues({
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
      } as membership);
    } else {
      setValues({
        ...empty,
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    setFieldErrors({});
    setError(null);
  }, [initialData, isOpen]);

  // load dropdown options
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
        const famOpts: SelectOption[] = famRows.map((f: any) => ({
          value: f.familyId,
          label: f.familyName
            ? `${f.familyName} (${f.familyId})`
            : String(f.familyId),
        }));

        const mmRes: Response = await getMembershipMasters({
          page: 1,
          limit: 1000,
        });
        const mmRows = Array.isArray(mmRes)
          ? mmRes
          : Array.isArray(mmRes?.data)
          ? mmRes.data
          : [];
        const mmOpts: SelectOption[] = mmRows.map((m: any) => ({
          value: m.membershipMasterId,
          label: m.membershipType
            ? `${m.membershipType} (${m.membershipMasterId})`
            : String(m.membershipMasterId),
        }));

        if (!mounted) return;
        setFamilyOptions(famOpts);
        setMembershipMasterOptions(mmOpts);
      } catch (err) {
        console.error(
          "Failed to load family or membership master options",
          err
        );
        if (!mounted) return;
        setFamilyOptions([]);
        setMembershipMasterOptions([]);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const onChange = (
    field: keyof membership,
    val: string | number | boolean | Date
  ) => {
    // convert select values (string) to number where needed
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
        issueCharges: Number(values.issueCharges),
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

  const fields = [
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
    { name: "endDate", label: "End Date", type: "Date", required: false },
    { name: "graceDate", label: "Grace Date", type: "Date", required: false },
    {
      name: "committedAmount",
      label: "Committed Amount",
      type: "number",
      required: false,
    },
    {
      name: "issueCharges",
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
      name: "actualFBalance",
      label: "Actual F Balance",
      type: "number",
      required: false,
    },
    {
      name: "actualCBalance",
      label: "Actual C Balance",
      type: "number",
      required: false,
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
    {
      name: "cancellationCharges",
      label: "Cancellation Charges",
      type: "number",
      required: false,
    },
  ] as any;

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
