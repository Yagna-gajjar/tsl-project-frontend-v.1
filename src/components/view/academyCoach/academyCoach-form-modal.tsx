import { useCallback, useEffect, useState } from "react";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import { formatDateForInput } from "@/lib/utils";
import { createAcademyCoach, updateAcademyCoach } from "@/api/academyCoach.api";
import type { AcademyCoach } from "@/types/academyCoach";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getAcademies } from "@/api/academy.api";
import type { Response } from "@/types/response";
import { toast } from "@/hooks/use-toast";
import { getCoaches } from "@/api/coach.api";
import type { Academy } from "@/types/academy";
import type { Coach } from "@/types/coach";

type Props = {
  isOpen: boolean;
  initialData?: AcademyCoach;
  onClose: () => void;
  onSave: () => void;
};

const empty = {
  coachId: 0,
  academyId: 0,
  joiningDate: new Date(),
  relievedDate: new Date(),
  designation: "",
  description: "",
  rfid: "",
  thumbprint: "",
} as AcademyCoach;

export default function AcademyCoachFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<AcademyCoach>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [academyOptions, setAcademyOptions] = useState<
    {
      label: string;
      value: number;
    }[]
  >([]);
  const [coachOptions, setCoachOptions] = useState<
    {
      label: string;
      value: number;
    }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseValues: AcademyCoach = { ...empty };

        if (initialData) {
          baseValues.academyCoachesId = initialData.academyCoachesId;
          baseValues.coachId = initialData.coachId;
          baseValues.academyId = initialData.academyId;
          baseValues.joiningDate = initialData.joiningDate
            ? formatDateForInput(initialData.joiningDate)
            : "";
          baseValues.relievedDate = initialData.relievedDate
            ? formatDateForInput(initialData.relievedDate)
            : undefined;
          baseValues.designation = initialData.designation;
          baseValues.description = initialData.description;
          baseValues.rfid = initialData.rfid;
          baseValues.thumbprint = initialData.thumbprint;
        }

        setValues(baseValues as AcademyCoach);
        setFieldErrors({});
        setError(null);

        const res: Response<Academy[]> = await getAcademies();
        const academyoptions = Array.isArray(res.data)
          ? res.data.map((academy: Academy) => ({
              value: academy.academyId as number,
              label: academy.academyName as string,
            }))
          : [];

        setAcademyOptions(academyoptions);

        const res1: Response = await getCoaches();

        const coachoptions = Array.isArray(res1)
          ? res1.map((coach: Coach) => ({
              value: coach.coachId,
              label:
                coach.coachFirstName +
                " " +
                coach.coachLastName +
                " " +
                coach.coachMiddleName,
            }))
          : [];

        setCoachOptions(coachoptions);
      } catch (err) {
        console.error("Failed to load academy data:", err);

        // Show toast
        toast({
          variant: "destructive",
          title: "Failed to load academies",
          description: "Something went wrong.",
        });

        // Keep form clean instead of partial state
        setAcademyOptions([]);
        setError("Failed to load data");
      }
    };

    fetchData();
  }, [initialData, isOpen]);

  const onChange = (field: keyof AcademyCoach, val: string | number) => {
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
    if (!values.coachId || Number(values.coachId) === 0) {
      errs.coachId = "Coach is required";
    }
    if (!values.academyId || Number(values.academyId) === 0) {
      errs.academyId = "Academy is required";
    }
    if (!values.designation || String(values.designation).trim() === "") {
      errs.designation = "Designation is required";
    }
    if (!values.joiningDate) {
      errs.joiningDate = "Joining date is required";
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
      const payload: Partial<AcademyCoach> = {
        coachId: Number(values.coachId),
        academyId: Number(values.academyId),
        joiningDate: values.joiningDate
          ? new Date(values.joiningDate as unknown as string)
          : undefined,
        relievedDate: values.relievedDate
          ? new Date(values.relievedDate as unknown as string)
          : undefined,
        designation: values.designation,
        description: values.description || undefined,
        rfid: values.rfid || undefined,
        thumbprint: values.thumbprint || undefined,
      };

      if (initialData?.academyCoachesId) {
        const res: Response<AcademyCoach> = await updateAcademyCoach(
          initialData.academyCoachesId,
          payload as Omit<
            AcademyCoach,
            "academyCoachesId" | "createdAt" | "updatedAt"
          >
        );
        if (res.success !== true) {
          throw new Error("Failed to update academy coach");
        } else {
          toast({
            title: "Success",
            description: "Academy coach updated successfully",
            variant: "success",
          });
        }
      } else {
        const res: Response<AcademyCoach> = await createAcademyCoach(
          payload as Omit<
            AcademyCoach,
            "academyCoachesId" | "createdAt" | "updatedAt"
          >
        );

        if (res.success !== true) {
          throw new Error("Failed to create academy coach");
        } else {
          toast({
            title: "Success",
            description: "Academy coach created successfully",
            variant: "success",
          });
        }
      }
      onSave();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, values, initialData, onSave, onClose]);

  const fields = [
    {
      name: "coachId",
      label: "Coach ID",
      type: "select",
      options: coachOptions,
      required: true,
    },
    {
      name: "academyId",
      label: "Academy ID",
      type: "select",
      options: academyOptions,
      required: true,
    },
    {
      name: "joiningDate",
      label: "Joining Date",
      type: "date",
      required: true,
    },
    {
      name: "relievedDate",
      label: "Relieved Date",
      type: "date",
      required: false,
    },
    {
      name: "designation",
      label: "Designation",
      type: "text",
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: false,
    },
    {
      name: "rfid",
      label: "RFID",
      type: "text",
      required: false,
    },
    {
      name: "thumbprint",
      label: "Thumbprint",
      type: "text",
      required: false,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any;

  if (!isOpen) return null;

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
              title={
                initialData?.academyCoachesId
                  ? "Edit Academy Coach"
                  : "Add New Academy Coach"
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
                    field: keyof AcademyCoach,
                    value: string | number
                  ) => void
                }
                layout="grid"
              />
            </div>
            <FormFooter
              onClose={onClose}
              onSubmit={handleSubmit}
              submitLabel={initialData?.academyCoachesId ? "Update" : "Create"}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}
