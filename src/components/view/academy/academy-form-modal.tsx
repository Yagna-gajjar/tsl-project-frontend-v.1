import { useCallback, useEffect, useState } from "react";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import { formatDateForInput } from "@/lib/utils";

import { createAcademy, updateAcademy } from "@/api/academy.api";
import type { Academy } from "@/types/academy";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";
import { getActivities } from "@/api/activity.api";
import type { Activity } from "@/types/activity";
type Props = {
  isOpen: boolean;
  initialData?: Academy;
  onClose: () => void;
  onSave: () => void;
};

const empty: Academy = {
  academyId: 0,
  academyType: "",
  registrationDate: undefined,
  academyName: "",
  addressId: undefined,
  contactNumber: "",
  email: "",
  instagram: "",
  facebook: "",
  youtube: "",
  about: "",
  share_main: undefined,
  share_tanna: undefined,
  share_tsl: undefined,
  share_expenses: undefined,
  panCard: "",
  discontinuedDate: undefined,
} as Academy;

export default function AcademyFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<Academy>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);

  const getAllActivity = async () => {
    try {
      const res: Response<Activity[]> = await getActivities();
      const data = res?.data || [];

      if (res.success !== true) {
        setError(res.message);
        throw new Error(res.message);
      } else {
        toast({
          title: "Success",
          description: "Academy coach created successfully",
          variant: "success",
        });
      }
      setActivity(data);
    } catch {
      toast({
        title: "Error",
        description: error ? error : "failed to create academy",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const baseValues: Record<string, unknown> = { ...empty };
    if (initialData) {
      baseValues.academyId = initialData.academyId;
      baseValues.academyType = initialData.academyType;
      baseValues.registrationDate = initialData.registrationDate
        ? formatDateForInput(initialData.registrationDate)
        : undefined;
      baseValues.academyName = initialData.academyName;
      baseValues.addressId = initialData.addressId;
      baseValues.contactNumber = initialData.contactNumber;
      baseValues.email = initialData.email;
      baseValues.instagram = initialData.instagram;
      baseValues.facebook = initialData.facebook;
      baseValues.youtube = initialData.youtube;
      baseValues.about = initialData.about;
      baseValues.share_main = initialData.share_main;
      baseValues.share_tanna = initialData.share_tanna;
      baseValues.share_tsl = initialData.share_tsl;
      baseValues.share_expenses = initialData.share_expenses;
      baseValues.panCard = initialData.panCard;
      baseValues.discontinuedDate = initialData.discontinuedDate
        ? formatDateForInput(initialData.discontinuedDate)
        : undefined;
    }
    getAllActivity();
    setValues(baseValues as unknown as Academy);
    setFieldErrors({});
    setError(null);
  }, [initialData, isOpen]);

  const onChange = (field: keyof Academy, val: string | number) => {
    // Handle date formatting for date fields
    let value: string | number | undefined = val;
    if (
      (field === "registrationDate" || field === "discontinuedDate") &&
      typeof val === "string"
    ) {
      // If the value is empty, set undefined, otherwise keep the string for the date input
      value = val === "" ? undefined : val;
    }

    setValues((p) => ({ ...p, [field]: value }));

    setFieldErrors((prev) => {
      if (!prev[field as string]) return prev;
      const copy = { ...prev };
      delete copy[field as string];
      return copy;
    });
  };

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!values.academyName || String(values.academyName).trim() === "") {
      errs.academyName = "Academy name is required";
    }
    if (!values.contactNumber || String(values.contactNumber).trim() === "") {
      errs.contactNumber = "Contact number is required";
    } else if (!/^\d+$/.test(values.contactNumber)) {
      errs.contactNumber = "Contact number must be numeric";
    }
    if (!values.email || String(values.email).trim() === "") {
      errs.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errs.email = "Email is invalid";
    }
    if (!values.registrationDate) {
      errs.registrationDate = "Registration date is required";
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
      const payload: Partial<Academy> = {
        academyType: values.academyType || undefined,
        registrationDate: values.registrationDate
          ? new Date(values.registrationDate)
          : undefined,
        academyName: values.academyName,
        addressId: values.addressId ? Number(values.addressId) : undefined,
        contactNumber: values.contactNumber || undefined,
        email: values.email || undefined,
        instagram: values.instagram || undefined,
        facebook: values.facebook || undefined,
        youtube: values.youtube || undefined,
        about: values.about || undefined,
        share_main: values.share_main ? Number(values.share_main) : undefined,
        share_tanna: values.share_tanna
          ? Number(values.share_tanna)
          : undefined,
        share_tsl: values.share_tsl ? Number(values.share_tsl) : undefined,
        share_expenses: values.share_expenses
          ? Number(values.share_expenses)
          : undefined,
        panCard: values.panCard || undefined,
        discontinuedDate: values.discontinuedDate
          ? new Date(values.discontinuedDate)
          : undefined,
      };

      if (initialData?.academyId) {
        await updateAcademy(initialData.academyId, payload);
      } else {
        await createAcademy(
          payload as Omit<Academy, "academyId" | "createdAt" | "updatedAt">
        );
      }
      onSave();
      onClose();
      toast({
        title: "Success",
        description: initialData?.academyId
          ? "Academy updated successfully"
          : "Academy created successfully",
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to load facilities.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, values, initialData, onSave, onClose]);

  const fields = [
    {
      name: "academyName",
      label: "Academy Name",
      type: "text",
      required: true,
    },
    {
      name: "academyType",
      label: "Academy Type",
      type: "select",
      options: activity.map((a) => ({
        label: a.activityName,
        value: a.activityId,
      })),
      required: false,
    },
    {
      name: "registrationDate",
      label: "Registration Date",
      type: "date",
      required: true,
    },
    {
      name: "contactNumber",
      label: "Contact Number",
      type: "text",
      required: true,
    },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "instagram", label: "Instagram", type: "text", required: false },
    { name: "facebook", label: "Facebook", type: "text", required: false },
    { name: "youtube", label: "YouTube", type: "text", required: false },
    { name: "about", label: "About", type: "textarea", required: false },
    { name: "addressId", label: "Address ID", type: "number", required: false },
    {
      name: "share_main",
      label: "Share Main",
      type: "number",
      required: false,
    },
    {
      name: "share_tanna",
      label: "Share Tanna",
      type: "number",
      required: false,
    },
    { name: "share_tsl", label: "Share TSL", type: "number", required: false },
    {
      name: "share_expenses",
      label: "Share Expenses",
      type: "number",
      required: false,
    },
    { name: "panCard", label: "PAN Card", type: "text", required: false },
    {
      name: "discontinuedDate",
      label: "Discontinued Date",
      type: "date",
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
                initialData?.academyId ? "Edit Academy" : "Add New Academy"
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
                    field: keyof Academy,
                    value: string | number
                  ) => void
                }
                layout="grid"
              />
            </div>
            <FormFooter
              onClose={onClose}
              onSubmit={handleSubmit}
              submitLabel={initialData?.academyId ? "Update" : "Create"}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}
