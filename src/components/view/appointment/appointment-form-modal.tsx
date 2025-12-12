import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormContent } from "@/components/form-modal/form-content";
import { FormFooter } from "@/components/form-modal/form-footer";
import type { Appointment } from "@/types/appointment";
import {
  createAppointment,
  updateAppointment,
} from "@/api/appointment.api";
import { toast } from "@/hooks/use-toast";
import { getEnrollments } from "@/api/enrollment.api";
import { getBatch } from "@/api/batch.api";

type Props = {
  isOpen: boolean;
  initialData?: Appointment;
  onClose: () => void;
  onSave: () => void;
};

const empty: Appointment = {
  appointmentId: 0,
  enrollmentId: undefined,
  noOfPerson: 1,
  batchId: undefined,
};

export default function AppointmentFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<Appointment>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [enrollmentOptions, setEnrollmentOptions] = useState<
    [string, number][]
  >([]);
  const [batchOptions, setBatchOptions] = useState<[string, number][]>([]);

  useEffect(() => {
    setValues({ ...empty, ...(initialData ?? {}) });
    setFieldErrors({});
    setError(null);
  }, [initialData, isOpen]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [eRes, bRes] = await Promise.all([
          getEnrollments({ limit: 1000 }),
          getBatch({ limit: 1000 }),
        ]);

        const enrollments = Array.isArray((eRes as any)?.data)
          ? (eRes as any).data
          : Array.isArray(eRes)
          ? eRes
          : [];
        const batches = Array.isArray((bRes as any)?.data)
          ? (bRes as any).data
          : Array.isArray(bRes)
          ? bRes
          : [];

        setEnrollmentOptions(
          enrollments.map((e: any) => [
            String(e.enrollmentName ?? `${e.enrollmentId}`),
            Number(e.enrollmentId),
          ])
        );

        setBatchOptions(
          batches.map((b: any) => [
            String(b.batchName ?? b.batchId ?? ""),
            Number(b.batchId),
          ])
        );
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load enrollments or batches",
          variant: "destructive",
        });
      }
    };

    fetchOptions();
  }, []);

  const onChange = (field: keyof Appointment, val: string | number | null) => {
    setValues((p) => ({ ...p, [field]: val }));
    setFieldErrors((prev) => {
      if (!prev[field as string]) return prev;
      const copy = { ...prev };
      delete copy[field as string];
      return copy;
    });
  };

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!values.enrollmentId) errs.enrollmentId = "Enrollment is required";
    if (!values.batchId) errs.batchId = "Batch is required";
    if (values.noOfPerson != null && Number(values.noOfPerson) <= 0)
      errs.noOfPerson = "No. of person must be at least 1";
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
      const payload: Partial<Appointment> = {
        enrollmentId: values.enrollmentId
          ? Number(values.enrollmentId)
          : undefined,
        noOfPerson: values.noOfPerson ? Number(values.noOfPerson) : 1,
        batchId: values.batchId ? Number(values.batchId) : undefined,
      };

      let res;
      if (initialData?.appointmentId) {
        res = await updateAppointment(initialData.appointmentId, payload);
      } else {
        res = await createAppointment(
          payload as Omit<
            Appointment,
            "appointmentId" | "createdAt" | "updatedAt"
          >
        );
      }

      const ok =
        typeof res?.success !== "undefined"
          ? res.success === true || String(res.success) === "true"
          : true;
      if (!ok) {
        const msg = res?.message ?? "Failed to save";
        setError(msg);
        toast({
          title: "Save failed",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      onSave();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, values, initialData, onSave, onClose]);

  const fields = [
    {
      name: "enrollmentId",
      label: "Enrollment",
      type: "select",
      options: enrollmentOptions,
      required: true,
    },
    {
      name: "noOfPerson",
      label: "No. of Persons",
      type: "number",
      required: true,
    },
    {
      name: "batchId",
      label: "Batch",
      type: "select",
      options: batchOptions,
      required: true,
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
      <DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
        <div className="flex flex-col max-h-[90vh] overflow-hidden">
          <FormHeader
            title={
              initialData?.appointmentId
                ? "Edit Appointment"
                : "Add Appointment"
            }
            onClose={onClose}
          />
          <div>
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
              onChange={onChange as any}
              layout="grid"
            />
          </div>
          <FormFooter
            onClose={onClose}
            onSubmit={handleSubmit}
            submitLabel={initialData?.appointmentId ? "Update" : "Create"}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
