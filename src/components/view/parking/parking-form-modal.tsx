import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import { toast } from "@/hooks/use-toast";

import type { Parking } from "@/types/parking";
import type { Response } from "@/types/response";
import { createParking, editParking } from "@/api/parking.api";
import { getMembers } from "@/api/member.api";
import type { Member } from "@/types/member";
import type { FormFieldConfig } from "@/components/form-modal/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Parking> | null;
  onSaved?: (row: Parking) => void;
};

export function ParkingFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSaved,
}: Props) {
  const isEdit = Boolean(initialData && initialData.parkingId);

  const empty: Partial<Parking> = useMemo(
    () => ({
      memberId: initialData?.memberId ?? undefined,
      vehicleType: initialData?.vehicleType ?? "",
      vehicleNumber: initialData?.vehicleNumber ?? "",
      status: initialData?.status ?? "active",
      remarks: initialData?.remarks ?? "",
      startDate: initialData?.startDate ?? undefined,
      endDate: initialData?.endDate ?? undefined,
      startTime: initialData?.startTime ?? undefined,
      entTime: initialData?.entTime ?? undefined,
      paymentAmount: initialData?.paymentAmount ?? 0,
      paymentType: initialData?.paymentType ?? "Parking Reciept",
      paymentMode: initialData?.paymentMode ?? "cash",
      transactionId: initialData?.transactionId ?? "",
      paid: initialData?.paid ?? 0,
      remaining:
        typeof initialData?.remaining !== "undefined"
          ? initialData?.remaining
          : Number(initialData?.paymentAmount ?? 0) -
          Number(initialData?.paid ?? 0) || 0,
      paymentRemarks: initialData?.paymentRemarks ?? "",
    }),
    [initialData]
  );

  const [values, setValues] = useState<Partial<Parking>>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [_, setLoadingMembers] = useState(false);

  useEffect(() => {
    const merged = { ...empty, ...(initialData ?? {}) } as Partial<Parking>;
    merged.paymentAmount = Number(merged.paymentAmount ?? 0);
    merged.paid = Number(merged.paid ?? 0);
    merged.remaining = Number(merged.paymentAmount) - Number(merged.paid);
    if (Number.isNaN(merged.remaining)) merged.remaining = 0;

    setValues(merged);
    setFieldErrors({});
    setError(null);
  }, [initialData, isOpen]);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoadingMembers(true);
        const res: Response<Member[]> = await getMembers({ page: 1, limit: 500 });
        const rows = res?.data ?? (Array.isArray(res) ? res : []);
        setMembers(Array.isArray(rows) ? rows : []);
      } catch (err) {
        console.error("Failed to load members", err);
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };
    loadMembers();
  }, []);

  const onChange = (field: keyof Parking, val: any) => {
    setValues((p) => {
      const copy = { ...(p ?? {}) } as Partial<Parking>;
      if (
        field === "paymentAmount" ||
        field === "paid"
      ) {
        const num = val === "" || val === null ? 0 : Number(val);
        copy[field] = num as any;
      } else if (field === "memberId") {
        copy.memberId = val === "" ? undefined : Number(val);
      } else {
        copy[field] = val;
      }

      if (field === "paymentAmount" || field === "paid") {
        const total = Number(
          field === "paymentAmount"
            ? val === ""
              ? 0
              : val
            : copy.paymentAmount ?? 0
        );

        const paidVal = Number(
          field === "paid" ? (val === "" ? 0 : val) : copy.paid ?? 0
        );
        const rem = Number(total) - Number(paidVal);
        copy.remaining = Number.isFinite(rem) ? rem : 0;
      }

      return copy;
    });

    setFieldErrors((prev) => {
      if (!prev[field as string]) return prev;
      const copy = { ...prev } as Record<string, string>;
      delete copy[field as string];
      return copy;
    });
  };

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!values.memberId) errs.memberId = "Member is required";
    if (!values.vehicleNumber || String(values.vehicleNumber).trim() === "")
      errs.vehicleNumber = "Vehicle number required";
    if (!values.vehicleType || String(values.vehicleType).trim() === "")
      errs.vehicleType = "Vehicle type required";
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
      const payload: Partial<Parking> = {
        memberId: Number(values.memberId),
        vehicleType: String(values.vehicleType ?? "").trim(),
        vehicleNumber: String(values.vehicleNumber ?? "").trim(),
        status: String(values.status ?? "").trim(),
        remarks: values.remarks ? String(values.remarks) : undefined,
        startDate: values.startDate ? new Date(values.startDate) : undefined,
        endDate: values.endDate ? new Date(values.endDate) : undefined,
        startTime: values.startTime ? new Date(values.startTime) : undefined,
        entTime: values.entTime ? new Date(values.entTime) : undefined,
        paymentAmount: values.paymentAmount ? Number(values.paymentAmount) : 0,
        paymentType: values.paymentType
          ? values.paymentType
          : "Parking Reciept",
        paymentMode: values.paymentMode
          ? String(values.paymentMode)
          : undefined,
        transactionId:
          values.paymentMode &&
            String(values.paymentMode).toLowerCase() !== "cash"
            ? values.transactionId
              ? String(values.transactionId)
              : undefined
            : undefined,
        paid: values.paid ? Number(values.paid) : 0,
        remaining: values.remaining ? Number(values.remaining) : 0,
        paymentRemarks: values.paymentRemarks
          ? String(values.paymentRemarks)
          : undefined,
      };

      let res: Response;
      if (isEdit && initialData?.parkingId) {
        res = await editParking(Number(initialData.parkingId), payload);
      } else {
        res = await createParking(payload as Parking);
      }

      const ok =
        typeof res?.success !== "undefined"
          ? res.success === true || String(res.success) === "true"
          : true;
      if (!ok) {
        const msg = (res as any)?.message ?? "Failed to save";
        setError(msg);
        toast({
          title: "Save failed",
          description: msg,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      onSaved?.(values as Parking);
      onClose();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save parking";
      setError(errorMsg);
      toast({ variant: "destructive", description: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, isEdit, initialData, onSaved, onClose, validate]);

  const memberOptions = members.map((m) => ({
    value: String(m.memberId),
    label: `${m.memberFirstName} ${m.memberLastName}`,
  }));

  const fields: FormFieldConfig<Parking>[] | any = useMemo(() => {
    const base = [
      {
        name: "memberId",
        label: "Member",
        type: "select",
        options: memberOptions,
        required: true,
      },
      {
        name: "vehicleType",
        label: "Vehicle Type",
        type: "text",
        required: true,
      },
      {
        name: "vehicleNumber",
        label: "Vehicle Number",
        type: "text",
        required: true,
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ],
        required: true,
      },
      { name: "startDate", label: "Start Date", type: "Date" },
      { name: "endDate", label: "End Date", type: "Date" },
      { name: "startTime", label: "Start Time", type: "time" },
      { name: "entTime", label: "End Time", type: "time" },
      { name: "paymentAmount", label: "Total Amount", type: "number" },
      { name: "paid", label: "Paid", type: "number" },
      { name: "remaining", label: "Remaining", type: "number", disabled: true },
      {
        name: "paymentType",
        label: "Payment Type",
        type: "text",
        disabled: true,
      },
      {
        name: "paymentMode",
        label: "Payment Mode",
        type: "select",
        options: [
          { value: "cash", label: "Cash" },
          { value: "online", label: "Online" },
          { value: "upi", label: "UPI" },
        ],
      },
    ];

    if (
      !values?.paymentMode ||
      String(values.paymentMode).toLowerCase() !== "cash"
    ) {
      base.push({
        name: "transactionId",
        label: "Transaction ID",
        type: "text",
      });
    }

    base.push({
      name: "paymentRemarks",
      label: "Payment Remarks",
      type: "textarea",
    });

    return base;
  }, [memberOptions, values?.paymentMode]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <div>
        <DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
          <div className="flex flex-col max-h-[90vh] overflow-hidden">
            <FormHeader
              title={initialData?.parkingId ? "Edit Coach" : "Add New Coach"}
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
                    field: keyof Parking,
                    value: string | number
                  ) => void
                }
                layout="grid"
              />
            </div>
            <FormFooter
              onClose={onClose}
              onSubmit={handleSubmit}
              submitLabel={initialData?.parkingId ? "Update" : "Create"}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}

export default ParkingFormModal;
