import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormContent } from "@/components/form-modal/form-content";
import { FormFooter } from "@/components/form-modal/form-footer";
import type { BatchConnection } from "@/types/batchConnection";
import type { Batch } from "@/types/batch";
import {
  createBatchConnection,
  updateBatchConnection,
} from "@/api/batchConnection.api";
import { toast } from "@/hooks/use-toast";
import { getBatch } from "@/api/batch.api";

type Props = {
  isOpen: boolean;
  initialData?: BatchConnection;
  onClose: () => void;
  onSave: () => void;
};

const empty: BatchConnection = {
  batchConnectionId: 0,
  mainBatchId: undefined,
  preBatch: undefined,
  postBatch: undefined,
  startDate: undefined,
  endDate: undefined,
};

export default function BatchConnectionFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<BatchConnection>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [mainOptions, setMainOptions] = useState<Batch[]>([]);
  const [preOptions, setPreOptions] = useState<Batch[]>([]);
  const [postOptions, setPostOptions] = useState<Batch[]>([]);

  useEffect(() => {
    setValues({ ...empty, ...(initialData ?? {}) });
    setFieldErrors({});
    setError(null);
  }, [initialData, isOpen]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [mRes, pRes, poRes] = await Promise.all([
          getBatch({ limit: 1000, batchType: "main" }),
          getBatch({ limit: 1000, batchType: "pre" }),
          getBatch({ limit: 1000, batchType: "post" }),
        ]);

        setMainOptions(mRes?.data as Batch[]);
        setPreOptions(pRes?.data as Batch[]);
        setPostOptions(poRes?.data as Batch[]);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load batches",
          variant: "destructive",
        });
      }
    };
    fetch();
  }, []);

  const onChange = (
    field: keyof BatchConnection,
    val: string | number | null
  ) => {
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
    if (!values.mainBatchId) errs.mainBatchId = "Main batch is required";
    if (values.startDate && values.endDate) {
      const s = new Date(String(values.startDate));
      const e = new Date(String(values.endDate));
      if (s > e) errs.endDate = "End date must be after start date";
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
      const payload: Partial<BatchConnection> = {
        mainBatchId: values.mainBatchId
          ? Number(values.mainBatchId)
          : undefined,
        preBatch: values.preBatch ? Number(values.preBatch) : undefined,
        postBatch: values.postBatch ? Number(values.postBatch) : undefined,
        startDate: values.startDate ?? undefined,
        endDate: values.endDate ?? undefined,
      };

      let res;
      if (initialData?.batchConnectionId) {
        res = await updateBatchConnection(
          initialData.batchConnectionId,
          payload
        );
      } else {
        res = await createBatchConnection(
          payload as Omit<
            BatchConnection,
            "batchConnectionId" | "createdAt" | "updatedAt"
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
      name: "mainBatchId",
      label: "Main Batch",
      type: "select",
      options: mainOptions.map((m) => ({
        label: m.batchName,
        value: m.batchId,
      })),
      required: true,
    },
    {
      name: "preBatch",
      label: "Pre Batch",
      type: "select",
      options: preOptions.map((p) => ({
        label: p.batchName,
        Value: p.batchId,
      })),
      required: false,
    },
    {
      name: "postBatch",
      label: "Post Batch",
      type: "select",
      options: postOptions.map((p) => ({
        label: p.batchName,
        Value: p.batchId,
      })),
      required: false,
    },
    { name: "startDate", label: "Start Date", type: "date", required: false },
    { name: "endDate", label: "End Date", type: "date", required: false },
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
              initialData?.batchConnectionId
                ? "Edit Batch Connection"
                : "Add Batch Connection"
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
            submitLabel={initialData?.batchConnectionId ? "Update" : "Create"}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
