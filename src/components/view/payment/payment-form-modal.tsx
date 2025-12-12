import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormContent } from "@/components/form-modal/form-content";
import { FormFooter } from "@/components/form-modal/form-footer";
import { createPayment } from "@/api/payment.api";
import { toast } from "@/hooks/use-toast";
import type { Payment } from "@/types/payment";
import type { Response } from "@/types/response";
import type { FormFieldConfig } from "@/components/form-modal/types";

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  committedAmount: string | number;
};

type PaymentFormValues = {
  paid: number;
  paymentMode: string;
  transactionId: string;
  paymentRemarks: string;
  paymentType: string;
};

export function PaymentFormModal({
  isOpen,
  onClose,
  payment,
  committedAmount,
}: PaymentModalProps) {
  const [values, setValues] = useState<PaymentFormValues>({
    paid: 0,
    paymentMode: "Online",
    paymentType: "Reciept",
    transactionId: "",
    paymentRemarks: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const remaining = useMemo(
    () => (payment ? Number.parseFloat(String(payment.remaining || 0)) : 0),
    [payment]
  );

  useEffect(() => {
    if (!payment) return;
    setValues({
      paid: Number(payment.remaining) || 0,
      paymentMode: "Online",
      paymentType: "Reciept",
      transactionId: "",
      paymentRemarks: "",
    });
    setFieldErrors({});
  }, [payment, isOpen]);

  const onChange = (field: keyof PaymentFormValues, val: string | number) => {
    const next: Partial<PaymentFormValues> = {};
    if (field === "paid") {
      next.paid = Number(val || 0);
    } else {
      next[field] = String(val || "");
    }
    setValues((p) => ({ ...p, ...(next as PaymentFormValues) }));

    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!payment) {
      errs.paid = "No payment selected";
      return errs;
    }
    if (!values.paid || Number(values.paid) <= 0) {
      errs.paid = "Please enter an amount greater than 0";
    } else if (Number(values.paid) > remaining) {
      errs.paid = `Cannot pay more than ₹${remaining.toFixed(2)}`;
    }
    if (values.paymentMode === "Online" && !values.transactionId.trim()) {
      errs.transactionId = "Transaction ID is required for online payments";
    }
    return errs;
  }, [values, payment, remaining]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setFieldErrors({});
    try {
      const errs = validate();
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        setIsSubmitting(false);
        return;
      }
      if (!payment) {
        toast({
          title: "Error",
          description: "No payment selected",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const totalAmount =
        Number(committedAmount) || Number(payment.totalAmount);
      const paid = Number(values.paid) || 0;
      const remainingCalculated = Math.max(0, Number(payment.remaining) - paid);

      const payload = {
        enrollmentId: payment.enrollmentId,
        paymentType: "receipt",
        totalAmount,
        paid,
        remaining: remainingCalculated,
        paymentMode: values.paymentMode,
        transactionId: values.transactionId,
        paymentRemarks: values.paymentRemarks,
      };

      const res: Response = await createPayment(payload);

      const ok =
        typeof res?.success !== "undefined"
          ? res.success === true || String(res.success) === "true"
          : true;

      if (!ok) {
        const msg = res?.message ?? "Failed to create payment";
        toast({
          title: "Save failed",
          description: msg,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "Success",
        description: "Payment recorded successfully",
        variant: "success",
      });
      onClose();
    } catch{
      toast({
        title: "Error",
        description: "Failed to submit payment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, values, payment, committedAmount, onClose]);

  const totalAmountDisplay = useMemo(
    () =>
      Number(committedAmount) || (payment ? Number(payment.totalAmount) : 0),
    [committedAmount, payment]
  );

  const fields: FormFieldConfig<Payment>[] = [
    {
      name: "paid",
      label: "Paying Now (₹)",
      type: "number",
      required: true,
      min: 1,
      max: remaining,
    },
    {
      name: "paymentMode",
      label: "Payment Mode",
      type: "select",
      required: true,
      options: [
        { value: "Cash", label: "Cash" },
        { value: "Online", label: "Online" },
        { value: "Cheque", label: "Cheque" },
        { value: "Bank Transfer", label: "Bank Transfer" },
      ],
    },
    {
      name: "paymentType",
      label: "Payment Type",
      type: "text",
      disabled: true,
      required: true
    },
    {
      name: "paymentRemarks",
      label: "Remarks",
      type: "textarea",
      required: false,
    },
    ...(values.paymentMode.toLowerCase() !== "cash"
      ? [
        {
          name: "transactionId",
          label: "Transaction ID",
          type: "text",
          required: true,
        },
      ]
      : []) as any,
  ];

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-md p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
        <div className="flex flex-col max-h-[90vh] overflow-hidden">
          <FormHeader
            title="Complete Payment"
            onClose={onClose}
          />

          <div className="p-4 overflow-auto">
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2 border border-blue-100 dark:border-blue-800">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Total Committed:
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  ₹{totalAmountDisplay}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Current Pending:
                </span>
                <span className="font-bold text-amber-600">
                  ₹{remaining.toFixed(2)}
                </span>
              </div>
            </div>

            <FormContent
              fields={fields}
              values={values}
              errors={fieldErrors}
              loading={false}
              error={null}
              isSubmitting={isSubmitting}
              onChange={(field: string, value: string | number) =>
                onChange(field as keyof PaymentFormValues, value)
              }
              layout="grid"
            />
          </div>

          <FormFooter
            onClose={onClose}
            onSubmit={handleSubmit}
            submitLabel="Submit Payment"
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
