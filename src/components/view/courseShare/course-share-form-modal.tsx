import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import { createCourseShare, updateCourseShare } from "@/api/courseShare.api";
import { getCourses } from "@/api/course.api";
import { getAcademies } from "@/api/academy.api";

import type { CourseShare } from "@/types/courseShare";
import type { Course } from "@/types/course";
import type { Academy } from "@/types/academy";
import type { FormFieldConfig } from "@/components/form-modal/types";
import type { Response } from "@/types/response";

type Props = {
  isOpen: boolean;
  initialData?: CourseShare;
  onClose: () => void;
  onSave: () => void;
};

const empty: CourseShare = {
  courseShareId: 0,
  academyId: 0,
  shareType: "",
  share: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function CourseShareFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<CourseShare>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [courses, setCourses] = useState<Course[]>([]);
  const [academies, setAcademies] = useState<Academy[]>([]);

  /* ---------- LOAD DROPDOWNS ---------- */
  useEffect(() => {
    if (!isOpen) return;

    const loadOptions = async () => {
      try {
        setLoading(true);
        const [courseRes, academyRes] = await Promise.all([
          getCourses({ limit: 500 }),
          getAcademies({ limit: 500 }),
        ]);

        setCourses((courseRes as Response<Course[]>)?.data ?? []);
        setAcademies((academyRes as Response<Academy[]>)?.data ?? []);
      } catch {
        setError("Failed to load dropdown data");
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, [isOpen]);

  /* ---------- INIT ---------- */
  useEffect(() => {
    setValues(initialData ?? empty);
    setErrors({});
    setError(null);
  }, [initialData, isOpen]);

  /* ---------- CHANGE ---------- */
  const onChange = (
    field: keyof CourseShare,
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

  /* ---------- VALIDATION ---------- */
  const validate = () => {
    const e: Record<string, string> = {};

    if (!values.academyId || Number(values.academyId) <= 0) {
      e.academyId = "Academy is required";
    }
    if (!values.shareType) {
      e.shareType = "Share type is required";
    }
    if (
      values.share === undefined ||
      values.share === null ||
      Number(values.share) <= 0 ||
      Number(values.share) > 100
    ) {
      e.share = "Share must be between 1 and 100";
    }

    return e;
  };

  /* ---------- SUBMIT ---------- */
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
      if (initialData?.courseShareId) {
        await updateCourseShare(initialData.courseShareId, values);
      } else {
        await createCourseShare(values);
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  }, [values, initialData, onSave, onClose]);

  /* ---------- FIELDS ---------- */
  const fields: FormFieldConfig<CourseShare>[] = [
    {
      name: "courseId",
      label: "Course Name",
      type: "select",
      required: true,
      options: courses?.map((c) => ({
        value: c.courseId,
        label: c.courseName,
      })),
    },
    {
      name: "academyId",
      label: "Academy",
      type: "select",
      required: true,
      options: academies.map((a) => ({
        label: a.academyName,
        value: String(a.academyId),
      })),
    },
    {
      name: "shareType",
      label: "Share Type",
      type: "text",
      required: true,
    },
    {
      name: "share",
      label: "Share (%)",
      type: "number",
      required: true,
    },
  ];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
        <div className="flex flex-col max-h-[80vh] overflow-hidden">
          <FormHeader
            title={initialData ? "Edit Course Share" : "Add Course Share"}
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
