import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import {
  createCoursePackage,
  updateCoursePackage,
} from "@/api/coursePackage.api";
import { getCourses } from "@/api/course.api";
import { getActivities } from "@/api/activity.api";

import type { CoursePackage } from "@/types/coursePackage";
import type { Course } from "@/types/course";
import type { Activity } from "@/types/activity";
import type { FormFieldConfig } from "@/components/form-modal/types";
import type { Response } from "@/types/response";

type Props = {
  isOpen: boolean;
  initialData?: CoursePackage;
  onClose: () => void;
  onSave: () => void;
};

const empty: CoursePackage = {
  coursePackageId: 0,
  courseId: 0,
  linkType: "",
  activityType: "",
  createdAt: "",
  updatedAt: "",
};

export default function CoursePackageFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<CoursePackage>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [courses, setCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  /* ---------------- LOAD DROPDOWNS ---------------- */
  useEffect(() => {
    if (!isOpen) return;

    const loadOptions = async () => {
      try {
        setLoading(true);

        const [courseRes, activityRes] = await Promise.all([
          getCourses({ limit: 500 }),
          getActivities({ limit: 500 }),
        ]);

        setCourses((courseRes as Response<Course[]>)?.data ?? []);
        setActivities((activityRes as Response<Activity[]>)?.data ?? []);
      } catch {
        setCourses([]);
        setActivities([]);
        setError("Failed to load dropdown data");
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, [isOpen]);

  /* ---------------- INIT FORM ---------------- */
  useEffect(() => {
    setValues(initialData ?? empty);
    setErrors({});
    setError(null);
  }, [initialData, isOpen]);

  /* ---------------- CHANGE ---------------- */
  const onChange = (
    field: keyof CoursePackage,
    value: string | number | boolean | null
  ) => {
    setValues((p) => ({ ...p, [field]: value }));
    if (errors[field]) {
      setErrors((e) => {
        const copy = { ...e };
        delete copy[field];
        return copy;
      });
    }
  };

  /* ---------------- VALIDATION ---------------- */
  const validate = () => {
    const e: Record<string, string> = {};

    if (!values.courseId || Number(values.courseId) <= 0) {
      e.courseId = "Course is required";
    }
    if (!values.activityType) {
      e.activityType = "Activity is required";
    }
    if (!values.linkType?.trim()) {
      e.linkType = "Link type is required";
    }

    return e;
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    const vErrors = validate();
    if (Object.keys(vErrors).length) {
      setErrors(vErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      if (initialData?.coursePackageId) {
        await updateCoursePackage(initialData.coursePackageId, values);
      } else {
        await createCoursePackage(values);
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  }, [values, initialData, onSave, onClose]);

  /* ---------------- FIELDS ---------------- */
  const fields: FormFieldConfig<CoursePackage>[] = [
    {
      name: "courseId",
      label: "Course",
      type: "select",
      required: true,
      options: courses.map((c) => ({
        label: c.courseName,
        value: String(c.courseId),
      })),
    },
    {
      name: "activityType",
      label: "Activity",
      type: "select",
      required: true,
      options: activities.map((a) => ({
        label: a.activityName,
        value: a.activityId,
      })),
    },
    {
      name: "linkType",
      label: "Link Type",
      type: "select",
      options: [
        {label: "Location Share", value: "locationShare"}
      ],
      required: true,
    },
  ];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
        <div className="flex flex-col max-h-[80vh] overflow-hidden">
          <FormHeader
            title={initialData ? "Edit Course Package" : "Add Course Package"}
            onClose={onClose}
          />

          <div className="flex-1 overflow-auto">
            {error && (
              <div className="m-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            <FormContent
              fields={fields}
              values={values}
              errors={errors}
              loading={loading}
              error={error}
              isSubmitting={isSubmitting}
              onChange={onChange}
              layout="grid"
            />
          </div>

          <FormFooter
            onClose={onClose}
            onSubmit={handleSubmit}
            submitLabel={initialData ? "Update" : "Create"}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
