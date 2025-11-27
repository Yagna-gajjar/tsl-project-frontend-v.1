import { useCallback, useEffect, useState } from "react";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import { formatDateForInput } from "@/lib/utils";
import { createCoach, updateCoach } from "@/api/coach.api";
import type { Coach } from "@/types/coach";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";

type Props = {
  isOpen: boolean;
  initialData?: Coach;
  onClose: () => void;
  onSave: () => void;
};

const empty: Coach = {
  coachId: 0,
  coachFirstName: "",
  coachMiddleName: "",
  coachLastName: "",
  email: "",
  contactNumber: "",
  dob: undefined,
  joinDate: undefined,
  remarks: "",
  status: "active",
  gender: undefined,
  bloodGroup: undefined,
  aadharCard: "",
  qualification: "",
  achievements: "",
  achievementsInDetails: "",
  photo: "",
} as Coach;

export default function CoachFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<Coach>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const baseValues: Record<string, unknown> = { ...empty };
    if (initialData) {
      baseValues.coachId = initialData.coachId;
      baseValues.coachFirstName = initialData.coachFirstName;
      baseValues.coachMiddleName = initialData.coachMiddleName;
      baseValues.coachLastName = initialData.coachLastName;
      baseValues.email = initialData.email;
      baseValues.contactNumber = initialData.contactNumber;
      baseValues.dob = initialData.dob
        ? formatDateForInput(initialData.dob)
        : undefined;
      baseValues.joinDate = initialData.joinDate
        ? formatDateForInput(initialData.joinDate)
        : undefined;
      baseValues.remarks = initialData.remarks;
      baseValues.status = initialData.status;
      baseValues.gender = initialData.gender;
      baseValues.bloodGroup = initialData.bloodGroup;
      baseValues.aadharCard = initialData.aadharCard;
      baseValues.qualification = initialData.qualification;
      baseValues.achievements = initialData.achievements;
      baseValues.achievementsInDetails = initialData.achievementsInDetails;
      baseValues.photo = initialData.photo;
    }
    setValues(baseValues as unknown as Coach);
    setFieldErrors({});
    setError(null);
  }, [initialData, isOpen]);

  const onChange = (field: keyof Coach, val: string | number) => {
    let value: string | number | undefined = val;
    if ((field === "dob" || field === "joinDate") && typeof val === "string") {
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
    if (!values.coachFirstName || String(values.coachFirstName).trim() === "") {
      errs.coachFirstName = "Coach first name is required";
    }
    if (!values.coachLastName || String(values.coachLastName).trim() === "") {
      errs.coachLastName = "Coach last name is required";
    }
    if (!values.email || String(values.email).trim() === "") {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values.email))) {
      errs.email = "Please enter a valid email address";
    }
    if (!values.contactNumber || String(values.contactNumber).trim() === "") {
      errs.contactNumber = "Contact number is required";
    } else if (
      !/^\d{10}$/.test(String(values.contactNumber).replace(/\D/g, ""))
    ) {
      errs.contactNumber = "Please enter a valid 10-digit contact number";
    }
    if (!values.dob) {
      errs.dob = "Date of birth is required";
    }
    if (!values.gender) {
      errs.gender = "Gender is required";
    }
    if (!values.aadharCard || String(values.aadharCard).trim() === "") {
      errs.aadharCard = "Aadhar card is required";
    } else if (!/^\d{12}$/.test(String(values.aadharCard).replace(/\D/g, ""))) {
      errs.aadharCard = "Please enter a valid 12-digit Aadhar card number";
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
      const payload: Partial<Coach> = {
        coachFirstName: values.coachFirstName,
        coachMiddleName: values.coachMiddleName || undefined,
        coachLastName: values.coachLastName || undefined,
        email: values.email || undefined,
        contactNumber: values.contactNumber || undefined,
        dob: values.dob ? new Date(values.dob as unknown as string) : undefined,
        joinDate: values.joinDate
          ? new Date(values.joinDate as unknown as string)
          : undefined,
        remarks: values.remarks || undefined,
        status:
          (values.status as "active" | "inactive" | "suspended") || "active",
        gender: (values.gender as "male" | "female" | "other") || undefined,
        bloodGroup:
          (values.bloodGroup as
            | "b+"
            | "b-"
            | "a+"
            | "a-"
            | "o+"
            | "o-"
            | "ab+"
            | "ab-") || undefined,
        aadharCard: values.aadharCard || undefined,
        qualification: values.qualification || undefined,
        achievements: values.achievements || undefined,
        achievementsInDetails: values.achievementsInDetails || undefined,
        photo: values.photo || undefined,
      };
      let res: Response;
      if (initialData?.coachId) {
        res = await updateCoach(
          initialData.coachId,
          payload as Omit<Coach, "coachId" | "createdAt" | "updatedAt">
        );
      } else {
        res = await createCoach(
          payload as Omit<Coach, "coachId" | "createdAt" | "updatedAt">
        );
      }

      const ok =
        typeof res?.success !== "undefined"
          ? res.success === true || String(res.success) === "true"
          : true;

      const row = res?.data ?? res;

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
      toast({
        title: "Success",
        description: initialData?.coachId
          ? "Coach updated successfully"
          : "Coach created successfully",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save coach.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, values, initialData, onSave, onClose]);

  const fields = [
    {
      name: "coachFirstName",
      label: "First Name",
      type: "text",
      required: true,
    },
    {
      name: "coachMiddleName",
      label: "Middle Name",
      type: "text",
      required: false,
    },
    {
      name: "coachLastName",
      label: "Last Name",
      type: "text",
      required: true,
    },
    { name: "email", label: "Email", type: "email", required: true },
    {
      name: "contactNumber",
      label: "Contact Number",
      type: "text",
      required: true,
    },
    { name: "dob", label: "Date of Birth", type: "date", required: true },
    { name: "joinDate", label: "Join Date", type: "date", required: false },
    { name: "remarks", label: "Remarks", type: "textarea", required: false },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: false,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "suspended", label: "Suspended" },
      ],
    },
    {
      name: "gender",
      label: "Gender",
      type: "select",
      required: true,
      options: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "other", label: "Other" },
      ],
    },
    {
      name: "bloodGroup",
      label: "Blood Group",
      type: "select",
      required: false,
      options: [
        { value: "a+", label: "A+" },
        { value: "a-", label: "A-" },
        { value: "b+", label: "B+" },
        { value: "b-", label: "B-" },
        { value: "o+", label: "O+" },
        { value: "o-", label: "O-" },
        { value: "ab+", label: "AB+" },
        { value: "ab-", label: "AB-" },
      ],
    },
    {
      name: "aadharCard",
      label: "Aadhar Card",
      type: "text",
      required: true,
    },
    {
      name: "qualification",
      label: "Qualification",
      type: "text",
      required: false,
    },
    {
      name: "achievements",
      label: "Achievements",
      type: "text",
      required: false,
    },
    {
      name: "achievementsInDetails",
      label: "Achievements In Details",
      type: "textarea",
      required: false,
    },
    {
      name: "photo",
      label: "Photo URL",
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
              title={initialData?.coachId ? "Edit Coach" : "Add New Coach"}
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
                    field: keyof Coach,
                    value: string | number
                  ) => void
                }
                layout="grid"
              />
            </div>
            <FormFooter
              onClose={onClose}
              onSubmit={handleSubmit}
              submitLabel={initialData?.coachId ? "Update" : "Create"}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}
