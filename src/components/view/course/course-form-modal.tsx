import { useCallback, useEffect, useState } from "react";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import { createCourse, updateCourse } from "@/api/course.api";
import type { Course } from "@/types/course";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getAcademies } from "@/api/academy.api";
import { getActivities } from "@/api/activity.api";

type Props = {
  isOpen: boolean;
  initialData?: Course;
  onClose: () => void;
  onSave: () => void;
};

const empty = {
  courseId: 0,
  academyId: 0,
  activityId: 0,
  courseName: "",
  description: "",
  durationType: "",
  durationDays: 0,
  sessionCount: 0,
  daysPerWeek: 0,
  level: "",
  gender: "male",
  ageGroup: "",
  status: "active",
  fees: 0,
} as unknown as Course;

export default function CourseFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<Course>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [activityOptions, setActivityOptions] = useState([]);
  const [academyOptions, setAcademyOptions] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (initialData) {
        setValues(initialData);
      } else {
        setValues(empty);
      }
      setFieldErrors({});
      setError(null);

      const [resActivity, resAcademy] = await Promise.all([
        getActivities(),
        getAcademies(),
      ]);
      const activityopts = Array.isArray(resActivity.data)
        ? resActivity.data.map((activity) => ({
            value: activity.activityId,
            label: activity.activityName,
          }))
        : [];

      const academyopts = Array.isArray(resAcademy)
        ? resAcademy.map((academy) => ({
            value: academy.academyId,
            label: academy.academyName,
          }))
        : [];
      setActivityOptions(activityopts);
      setAcademyOptions(academyopts);
    };

    loadData();
  }, [initialData, isOpen]);

  const onChange = (field: keyof Course, val: string | number | boolean) => {
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
    if (!values.courseName || String(values.courseName).trim() === "") {
      errs.courseName = "Course name is required";
    }
    if (!values.durationType || String(values.durationType).trim() === "") {
      errs.durationType = "Duration type is required";
    }
    if (!values.fees || Number(values.fees) === 0) {
      errs.fees = "Fees is required";
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
      const payload: Partial<Course> = {
        academyId: values.academyId || undefined,
        activityId: values.activityId || undefined,
        courseName: values.courseName,
        description: values.description || undefined,
        durationType: values.durationType,
        durationDays: values.durationDays || undefined,
        sessionCount: values.sessionCount || undefined,
        daysPerWeek: values.daysPerWeek || undefined,
        level: values.level || undefined,
        gender: values.gender || "male",
        ageGroup: values.ageGroup || undefined,
        status: values.status || "active",
        fees: Number(values.fees),
      };

      if (initialData?.courseId) {
        await updateCourse(
          initialData.courseId,
          payload as Omit<Course, "courseId" | "createdAt" | "updatedAt">
        );
      } else {
        await createCourse(
          payload as Omit<Course, "courseId" | "createdAt" | "updatedAt">
        );
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
      name: "courseName",
      label: "Course Name",
      type: "text",
      required: true,
    },
    {
      name: "academyId",
      label: "Academy Name",
      type: "select",
      options: academyOptions,
      required: false,
    },
    {
      name: "activityId",
      label: "Activity Name",
      type: "select",
      options: activityOptions,
      required: false,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: false,
    },
    {
      name: "durationType",
      label: "Duration Type",
      type: "text",
      required: true,
    },
    {
      name: "durationDays",
      label: "Duration Days",
      type: "number",
      required: false,
    },
    {
      name: "sessionCount",
      label: "Session Count",
      type: "number",
      required: false,
    },
    {
      name: "daysPerWeek",
      label: "Days Per Week",
      type: "number",
      required: false,
    },
    {
      name: "level",
      label: "Level",
      type: "text",
      required: false,
    },
    {
      name: "gender",
      label: "Gender",
      type: "select",
      options: [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
        { label: "Both", value: "both" },
      ],
      required: false,
    },
    {
      name: "ageGroup",
      label: "Age Group",
      type: "text",
      required: false,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Archived", value: "archived" },
      ],
      required: false,
    },
    {
      name: "fees",
      label: "Fees",
      type: "number",
      required: true,
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
              title={initialData?.courseId ? "Edit Course" : "Add New Course"}
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
                    field: keyof Course,
                    value: string | number | boolean
                  ) => void
                }
                layout="grid"
              />
            </div>
            <FormFooter
              onClose={onClose}
              onSubmit={handleSubmit}
              submitLabel={initialData?.courseId ? "Update" : "Create"}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}
