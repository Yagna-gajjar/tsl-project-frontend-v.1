import { useCallback, useEffect, useMemo, useState } from "react";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import { createCoachSkill, updateCoachSkill } from "@/api/coachSkill.api";
import type { CoachSkill } from "@/types/coachSkill";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";
import { getActivities } from "@/api/activity.api";
import type { FormFieldConfig } from "@/components/form-modal/types";
import { getMembers } from "@/api/member.api";
import type { Member } from "@/types/member";

type Props = {
  isOpen: boolean;
  initialData?: CoachSkill;
  onClose: () => void;
  onSave: () => void;
};

const empty: CoachSkill = {
  coachSkillId: 0,
  memberId: 0,
  activityId: 0,
  activityQualification: "",
  experience: "",
  currentlyInterest: "",
  currentlyInTeam: "",
  wantsUsToManageBookings: false,
  detailsOfChargesExpected: "",
  detailsOfServicesAvailable: "",
  status: "active",
  memberFirstName: "",
  memberLastName: "",
  activityName: "",
};

export default function CoachSkillFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<CoachSkill>(empty);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [memberOptions, setMemberOptions] = useState<{ label: string; value: number }[]>([]);
  const [activityOptions, setActivityOptions] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const loadOptions = async () => {
      try {
        setError(null);
        const [resMembers, resActivities] = await Promise.all([
          getMembers({ limit: 1000 }),
          getActivities(),
        ]);

        const members = (resMembers?.data as Member[]) || [];
        setMemberOptions(
          members.map((m: any) => ({
            value: m.memberId,
            label: `${m.memberFirstName} ${m.memberLastName}`,
          }))
        );

        const activities = Array.isArray(resActivities.data) ? resActivities.data : [];
        setActivityOptions(
          activities.map((a: any) => ({
            value: a.activityId,
            label: a.activityName,
          }))
        );

        if (initialData) {
          setValues({ ...initialData });
        } else {
          setValues(empty);
        }
        setFieldErrors({});
      } catch (err) {
        console.error("Option loading error:", err);
        setError("Failed to load required form options.");
      }
    };

    loadOptions();
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
    if (!values.memberId || values.memberId === 0) {
      errs.memberId = "Member/Coach selection is required";
    }
    if (!values.activityId || values.activityId === 0) {
      errs.activityId = "Activity selection is required";
    }
    if (!values.experience || String(values.experience).trim() === "") {
      errs.experience = "Experience details are required";
    }
    return errs;
  }, [values]);

  const handleSubmit = useCallback(async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Omit frontend-only fields and IDs for update/create logic
      const {
        coachSkillId, createdAt, updatedAt,
        memberFirstName, memberLastName, activityName,
        ...payload
      } = values;

      let res: Response<CoachSkill>;
      if (initialData?.coachSkillId) {
        res = await updateCoachSkill(initialData.coachSkillId, payload);
      } else {
        res = await createCoachSkill(payload);
      }

      if (res.success) {
        toast({
          title: "Success",
          description: `Skill entry ${initialData?.coachSkillId ? "updated" : "created"} successfully.`,
        });
        onSave();
        onClose();
      } else {
        throw new Error(res.message || "Operation failed");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, values, initialData, onSave, onClose]);

  const fields = useMemo<FormFieldConfig<CoachSkill>[]>(() => [
    {
      name: "memberId",
      label: "Member (Coach)",
      type: "select",
      options: memberOptions,
      required: true,
    },
    {
      name: "activityId",
      label: "Activity",
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
      label: "Qualification",
      type: "text",
    },
    {
      name: "currentlyInterest",
      label: "Current Interest",
      type: "text",
    },
    {
      name: "currentlyInTeam",
      label: "Currently In Team",
      type: "text",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Pending", value: "pending" },
      ],
    },
    {
      name: "wantsUsToManageBookings",
      label: "Wants Us To Manage Bookings",
      type: "checkbox",
    },
    {
      name: "detailsOfChargesExpected",
      label: "Charges Details",
      type: "text",
    },
    {
      name: "detailsOfServicesAvailable",
      label: "Services Details",
      type: "textarea",
    },
  ], [memberOptions, activityOptions]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
        <div className="flex flex-col max-h-[90vh]">
          <FormHeader
            title={initialData?.coachSkillId ? "Edit Coach Skill" : "Add Coach Skill"}
            onClose={onClose}
          />

          <div className="flex-1 overflow-y-auto">
            {error && (
              <div className="m-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
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
              onChange={(field, val) => onChange(field as keyof CoachSkill, val)}
              layout="grid"
            />
          </div>

          <FormFooter
            onClose={onClose}
            onSubmit={handleSubmit}
            submitLabel={initialData?.coachSkillId ? "Update Skill" : "Create Skill"}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}