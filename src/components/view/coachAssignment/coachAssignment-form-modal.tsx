import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormContent } from "@/components/form-modal/form-content";
import { FormFooter } from "@/components/form-modal/form-footer";
import type { CoachAssignment } from "@/types/coachAssignment";
import {
  createCoachAssignment,
  updateCoachAssignment,
} from "@/api/coachAssignment.api";
import type { Response } from "@/types/response";
import { toast } from "@/hooks/use-toast";
import { getBatch } from "@/api/batch.api";
import type { Batch } from "@/types/batch";
import type { FormFieldConfig } from "@/components/form-modal/types";
import { getMembers } from "@/api/member.api";
import type { Member } from "@/types/member";
import { getAccountMembers } from "@/api/accountMember.api";
import type { AccountMember } from "@/types/accountMember";

type Props = {
  isOpen: boolean;
  initialData?: CoachAssignment;
  onClose: () => void;
  onSave: () => void;
};

const empty: CoachAssignment = {
  academyCoachesId: 0,
  coachAssignmentId: 0,
  coachId: undefined,
  batchId: undefined,
  designation: "",
  responsibilities: "",
  cost: undefined,
  startDate: undefined,
  endDate: undefined,
  remarks: "",
};

export default function CoachAssignmentFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<CoachAssignment>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [_, setAcademyOptions] = useState<AccountMember[]>();
  const [coachOptions, setCoachOptions] = useState<Member[]>();
  const [batchOptions, setBatchOptions] = useState<Batch[]>();

  useEffect(() => {
    setValues({ ...empty, ...(initialData ?? {}) });
    setFieldErrors({});
    setError(null);
  }, [initialData, isOpen]);

  useEffect(() => {
    const fetchAcademy = async () => {
      try {
        const res: Response<AccountMember[]> = await getAccountMembers({
          limit: 100,
        });
        const data = Array.isArray(res.data)
          ? res.data
          : ([] as AccountMember[]);
        setAcademyOptions(data);
      } catch (_) {
        toast({
          title: "Error",
          description: "Failed to fetch Academies.",
          variant: "destructive",
        });
      }
    };
    fetchAcademy();
  }, []);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [cRes, bRes]: [
          cRes: Response<Member[]>,
          bRes: Response<Batch[]>
        ] = await Promise.all([
          getMembers({
            limit: 1000,
          }),
          getBatch({ limit: 1000 }),
        ]);

        const coaches = Array.isArray(cRes?.data)
          ? cRes.data
          : Array.isArray(cRes)
          ? cRes
          : [];
        const batches = Array.isArray(bRes?.data)
          ? bRes.data
          : Array.isArray(bRes)
          ? bRes
          : [];
        setCoachOptions(coaches);

        setBatchOptions(batches);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load coaches or batches",
          variant: "destructive",
        });
      }
    };
    if (values.academyCoachesId != 0 || values.academyCoachesId != undefined) {
      fetchOptions();
    }
  }, [values.academyCoachesId]);

  const onChange = (
    field: keyof CoachAssignment,
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
    if (!values.coachId) errs.coachId = "Coach is required";
    if (!values.batchId) errs.batchId = "Batch is required";
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
      const payload: Partial<CoachAssignment> = {
        coachId: values.coachId ? Number(values.coachId) : undefined,
        batchId: values.batchId ? Number(values.batchId) : undefined,
        designation: values.designation ?? undefined,
        responsibilities: values.responsibilities ?? undefined,
        cost: values.cost ? Number(values.cost) : undefined,
        startDate: values.startDate ?? undefined,
        endDate: values.endDate ?? undefined,
        remarks: values.remarks ?? undefined,
      };

      let res;
      if (initialData?.coachAssignmentId) {
        res = await updateCoachAssignment(
          initialData.coachAssignmentId,
          payload
        );
      } else {
        res = await createCoachAssignment(
          payload as Omit<
            CoachAssignment,
            "coachAssignmentId" | "createdAt" | "updatedAt"
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

  const fields = useMemo<FormFieldConfig<CoachAssignment>[]>(() => [
    // {
    //   name: "academyCoachesId",
    //   label: "Academy",
    //   type: "select",
    //   options: academyOptions?.map((a) => ({
    //     label: a.memberFirstName,
    //     value: a.accountMemberId,
    //   })),
    //   required: true,
    // },
    {
      name: "coachId",
      label: "Coach",
      type: "select",
      options: coachOptions?.map((c) => ({
        label: c.memberFirstName + " " + c.memberLastName,
        value: c.memberId,
      })),
      required: true,
    },
    {
      name: "batchId",
      label: "Batch",
      type: "select",
      options: batchOptions?.map((b) => ({
        label: b.batchName,
        value: b.batchId,
      })),
      required: true,
    },
    {
      name: "designation",
      label: "Designation",
      type: "text",
      required: false,
    },
    {
      name: "responsibilities",
      label: "Responsibilities",
      type: "textarea",
      required: false,
    },
    { name: "cost", label: "Cost", type: "number", required: false },
    { name: "startDate", label: "Start Date", type: "Date", required: false },
    { name: "endDate", label: "End Date", type: "Date", required: false },
    { name: "remarks", label: "Remarks", type: "textarea", required: false },
  ], [coachOptions, batchOptions]);

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
              initialData?.coachAssignmentId
                ? "Edit Coach Assignment"
                : "Add Coach Assignment"
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
              onChange={onChange}
              layout="grid"
            />
          </div>
          <FormFooter
            onClose={onClose}
            onSubmit={handleSubmit}
            submitLabel={initialData?.coachAssignmentId ? "Update" : "Create"}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
