import { useCallback, useEffect, useState } from "react";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import { createCoachSkill, updateCoachSkill } from "@/api/coachSkill.api";
import type { CoachSkill } from "@/types/coachSkill";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";
import { getActivities } from "@/api/activity.api";
import { getCoaches } from "@/api/coach.api";
import type { FormFieldConfig } from "@/components/form-modal/types";
import { getMembers } from "@/api/member.api";
import type { Member } from "@/types/member";

type Props = {
  isOpen: boolean;
  initialData?: CoachSkill;
  onClose: () => void;
  onSave: () => void;
};

const empty = {
  coachSkillId: 0,
  coachId: 0,
  activityId: 0,
  activityQualification: "",
  experience: "",
  currentInterest: "",
  currentlyInTeam: "",
  wantsUsToManageBookings: false,
  detailsOfChargesExpected: "",
  detailsOfServicesAvailable: "",
} as unknown as CoachSkill;

export default function CoachSkillFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<CoachSkill>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [coachOptions, setCoachOptions] = useState<Member[]>([]);
  const [activityOptions, setActivityOptions] = useState<
    {
      label: string;
      value: string | number;
    }[]
  >([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (initialData) {
          setValues(initialData);
        } else {
          setValues(empty);
        }

        setFieldErrors({});
        setError(null);

        const [resCoach, resActivity] = await Promise.all([
          getMembers({ limit: 1000 }),
          getActivities(),
        ]);
        const coachOpts = resCoach?.data as Member[];

        const activityOpts = Array.isArray(resActivity.data)
          ? resActivity.data.map((activity) => ({
              value: activity.activityId,
              label: `${activity.activityName}`,
            }))
          : [];

        setCoachOptions(coachOpts);

        setActivityOptions(activityOpts);
      } catch {
        toast({
          variant: "destructive",
          title: "Failed to load data",
          description: "Something went wrong.",
        });

        setCoachOptions([]);
        setActivityOptions([]);
        setError("Failed to load data");
      }
    };
    loadData();
  }, [initialData, isOpen]);

  const onChange = (
    field: keyof CoachSkill,
    val: string | number | boolean
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
    if (!values.coachId || Number(values.coachId) === 0) {
      errs.coachId = "Coach is required";
    }
    if (!values.activityId || Number(values.activityId) === 0) {
      errs.activityId = "Activity is required";
    }
    if (!values.experience || String(values.experience).trim() === "") {
      errs.experience = "Experience is required";
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
      toast({
        title: "Error",
        description: "Please fix the errors in the form.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: Partial<CoachSkill> = {
        coachId: Number(values.coachId),
        activityId: Number(values.activityId),
        activityQualification: values.activityQualification || undefined,
        experience: values.experience,
        currentInterest: values.currentInterest || undefined,
        currentlyInTeam: values.currentlyInTeam || undefined,
        wantsUsToManageBookings: Boolean(values.wantsUsToManageBookings),
        detailsOfChargesExpected: values.detailsOfChargesExpected || undefined,
        detailsOfServicesAvailable:
          values.detailsOfServicesAvailable || undefined,
      };
      let res: Response<CoachSkill>;
      if (initialData?.coachSkillId) {
        res = await updateCoachSkill(
          initialData.coachSkillId,
          payload as Omit<
            CoachSkill,
            "coachSkillId" | "createdAt" | "updatedAt"
          >
        );

        const ok =
          typeof res?.success !== "undefined"
            ? res.success === true || String(res.success) === "true"
            : true;

        if (!ok) {
          throw new Error("Failed to update coach skill");
        }
      } else {
        res = await createCoachSkill(
          payload as Omit<
            CoachSkill,
            "coachSkillId" | "createdAt" | "updatedAt"
          >
        );
        const ok =
          typeof res?.success !== "undefined"
            ? res.success === true || String(res.success) === "true"
            : true;
        if (!ok) {
          throw new Error("Failed to create coach skill");
        }
      }
      toast({
        title: "Success",
        description: `Coach skill ${
          initialData?.coachSkillId ? "updated" : "created"
        } successfully.`,
        variant: "success",
      });

      onSave();
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to ${
          initialData?.coachSkillId ? "update" : "create"
        } coach skill.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, values, initialData, onSave, onClose]);

  const fields: FormFieldConfig<CoachSkill>[] = [
    {
      name: "coachId",
      label: "Coach Name",
      type: "select",
      options: coachOptions?.map((c) => ({
        value: c.memberId,
        label: c.memberFirstName + " " + c.memberLastName,
      })),
      required: true,
    },
    {
      name: "activityId",
      label: "Activity Name",
      type: "select",
      options: activityOptions,
      required: true,
    },
    {
      name: "experience",
      label: "Experience",
      type: "text",
      required: true,
    },
    {
      name: "activityQualification",
      label: "Activity Qualification",
      type: "text",
      required: false,
    },
    {
      name: "currentInterest",
      label: "Current Interest",
      type: "text",
      required: false,
    },
    {
      name: "currentlyInTeam",
      label: "Currently In Team",
      type: "text",
      required: false,
    },
    {
      name: "wantsUsToManageBookings",
      label: "Wants Us To Manage Bookings",
      type: "checkbox",
      required: false,
    },
    {
      name: "detailsOfChargesExpected",
      label: "Details Of Charges Expected",
      type: "text",
      required: false,
    },
    {
      name: "detailsOfServicesAvailable",
      label: "Details Of Services Available",
      type: "textarea",
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
      <div>
        <DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
          <div className="flex flex-col max-h-[90vh] overflow-hidden">
            <FormHeader
              title={
                initialData?.coachSkillId
                  ? "Edit Coach Skill"
                  : "Add New Coach Skill"
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
                    field: keyof CoachSkill,
                    value: string | number | boolean
                  ) => void
                }
                layout="grid"
              />
            </div>
            <FormFooter
              onClose={onClose}
              onSubmit={handleSubmit}
              submitLabel={initialData?.coachSkillId ? "Update" : "Create"}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}
