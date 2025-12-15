import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import type { Course } from "@/types/course";
import type { Activity } from "@/types/activity";
import type { Enums } from "@/types/enums";

import { createCourse, updateCourse } from "@/api/course.api";
import { getActivities } from "@/api/activity.api";
import { getEnumsByCategory } from "@/api/enums.api";

import type { FormFieldConfig } from "@/components/form-modal/types";
import { format } from "date-fns";
import type { Response } from "@/types/response";
import { getAcademies } from "@/api/academy.api";
import type { Academy } from "@/types/academy";

type Props = {
  isOpen: boolean;
  initialData?: Course;
  onClose: () => void;
  onSave: () => void;
};

const empty: Course = {
  courseId: 0,
  academyId: 0,
  courseName: "",
  courseType: null,
  classification: null,
  activityName: null,
  introduceDate: "",
  suspensionDate: null,
  chargingPattern: null,
  sessionMinutes: 30,
  noOfDaysInWeek: 1,
  availabilityPattern: "",
  minEnrollmentUnits: 1,
  batchCapacity: 1,
  totalParallelBatches: 1,
  minAge: 1,
  maxAge: 100,
  gender: "Any",
  feeClassification: null,
  changable: false,
  freezingAllowed: 0,
  createdAt: "",
  updatedAt: "",
};

export default function CourseFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<Course>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activityOptions, setActivityOptions] = useState<Activity[]>([]);

  const [courseTypeOptions, setCourseTypeOptions] = useState<Enums[]>([]);
  const [academyOptions, setAcademyOptions] = useState<Academy[]>([]);
  const [loadingAcademies, setLoadingAcademies] = useState(false);

  const numberToWeekArray = (code?: number | string | null): string[] => {
    if (code === undefined || code === null) return [];
    const s = String(code);
    const map: Record<string, string> = {
      "1": "monday",
      "2": "tuesday",
      "3": "wednesday",
      "4": "thursday",
      "5": "friday",
      "6": "saturday",
      "7": "sunday",
    };
    const arr: string[] = [];
    for (const ch of s) {
      if (map[ch]) arr.push(map[ch]);
    }
    return arr;
  };

  const weekArrayToNumber = (arr?: any[]): number | undefined => {
    if (!Array.isArray(arr) || arr.length === 0) return undefined;
    const map: Record<string, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7,
    };
    const nums = arr
      .map((v) => (typeof v === "string" ? v.toLowerCase() : ""))
      .map((k) => map[k])
      .filter((n) => Number.isFinite(n)) as number[];

    if (nums.length === 0) return undefined;
    nums.sort((a, b) => a - b);
    return Number(nums.join(""));
  };

  const WEEKDAY_OPTIONS = useMemo(
    () => [
      { label: "Monday", value: "monday" },
      { label: "Tuesday", value: "tuesday" },
      { label: "Wednesday", value: "wednesday" },
      { label: "Thursday", value: "thursday" },
      { label: "Friday", value: "friday" },
      { label: "Saturday", value: "saturday" },
      { label: "Sunday", value: "sunday" },
    ],
    []
  );

  const loadAcademiesByActivity = useCallback(
    async (activityName?: string | null) => {
      if (!activityName) {
        setAcademyOptions([]);
        return;
      }

      try {
        setLoadingAcademies(true);
        const res = await getAcademies({
          academyType: activityName,
          limit: 200,
        });

        const items = Array.isArray((res as any)?.data ?? res)
          ? (res as any).data ?? res
          : [];

        setAcademyOptions(items);
      } catch {
        setAcademyOptions([]);
      } finally {
        setLoadingAcademies(false);
      }
    },
    []
  );

  useEffect(() => {
    const init = async () => {
      const resActivity: Response<Activity[]> = await getActivities({
        limit: 500,
      });
      const actOpts = resActivity?.data as Activity[];

      setActivityOptions(actOpts);

      const resEnums: Response<Enums[]> = await getEnumsByCategory(
        "courseType"
      );
      const enumOpts = resEnums?.data as Enums[];
      setCourseTypeOptions(enumOpts);
    };

    init();
  }, []);

  useEffect(() => {
    if (initialData) {
      setValues({
        ...initialData,
        introduceDate: initialData.introduceDate
          ? format(new Date(initialData.introduceDate), "yyyy-MM-dd")
          : "",
        suspensionDate: initialData.suspensionDate
          ? format(new Date(initialData.suspensionDate), "yyyy-MM-dd")
          : null,
      });
    } else {
      setValues(empty);
    }
    setErrors({});
    setError(null);
  }, [initialData, isOpen]);

  const onChange = (
    field: keyof Course,
    value: string | number | boolean | null
  ) => {
    // ACTIVITY CHANGED
    if (field === "activityName") {
      const activityName = value ? String(value) : null;

      const selectedActivity = activityOptions.find(
        (a) => a.activityName === activityName
      );

      setValues((p) => ({
        ...p,
        activityName,
        academyId: 0, // reset
        classification: selectedActivity?.activityType ?? null, // 🔥 AUTO SET
      }));

      setAcademyOptions([]);
      loadAcademiesByActivity(activityName);

      setErrors((e) => {
        const copy = { ...e };
        delete copy.activityName;
        delete copy.academyId;
        return copy;
      });
      return;
    }

    // ACADEMY CHANGED
    if (field === "academyId") {
      setValues((p) => ({
        ...p,
        academyId: value ? Number(value) : 0,
      }));
      setErrors((e) => {
        const copy = { ...e };
        delete copy.academyId;
        return copy;
      });
      return;
    }

    // DEFAULT
    setValues((p) => ({ ...p, [field]: value }));
    if (errors[field]) {
      setErrors((e) => {
        const copy = { ...e };
        delete copy[field];
        return copy;
      });
    }
  };

  const validate = useCallback(() => {
    const e: Record<string, string> = {};

    if (!values.courseName?.trim()) e.courseName = "Course name is required";

    if (!values.activityName) e.activityName = "Activity is required";

    if (!values.courseType) e.courseType = "Course type is required";

    if (!values.introduceDate) e.introduceDate = "Introduce date is required";

    if (values.sessionMinutes <= 0)
      e.sessionMinutes = "Session minutes must be > 0";

    if (values.noOfDaysInWeek <= 0)
      e.noOfDaysInWeek = "Days per week must be > 0";

    if (values.minEnrollmentUnits <= 0)
      e.minEnrollmentUnits = "Min enrollment units must be > 0";

    if (values.batchCapacity <= 0)
      e.batchCapacity = "Batch capacity must be > 0";

    if (values.totalParallelBatches <= 0)
      e.totalParallelBatches = "Parallel batches must be > 0";

    if (values.minAge <= 0) e.minAge = "Min age must be > 0";

    if (values.maxAge <= 0) e.maxAge = "Max age must be > 0";

    if (values.minAge > values.maxAge)
      e.maxAge = "Max age must be greater than min age";
    if (
      !values.availabilityPattern ||
      !Array.isArray(values.availabilityPattern) ||
      values.availabilityPattern.length === 0
    ) {
      e.availabilityPattern = "Select at least one weekday";
    }

    if (!values.academyId || values.academyId <= 0) {
      e.academyId = "Academy is required";
    }

    if (!values.classification) {
      e.classification = "Classification is required";
    }

    return e;
  }, [values]);

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
      const availabilityCode = weekArrayToNumber(
        values.availabilityPattern as any[]
      );

      const payload: Partial<Course> = {
        ...values,
        availabilityPattern: availabilityCode as any,
        suspensionDate: values.suspensionDate || null,
      };
      console.log(payload);

      if (initialData?.courseId) {
        await updateCourse(initialData.courseId, payload);
      } else {
        await createCourse(payload as Course);
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, initialData, onSave, onClose]);

  const fields: FormFieldConfig<Course>[] = [
    { name: "courseName", label: "Course Name", type: "text", required: true },

    {
      name: "activityName",
      label: "Activity",
      type: "select",
      required: true,
      options: activityOptions.map((a) => ({
        label: a.activityName,
        value: a.activityName,
      })),
    },

    {
      name: "academyId",
      label: "Academy",
      type: "select",
      required: true,
      disabled: loadingAcademies || !values.activityName,
      options: academyOptions.map((a) => ({
        label: a.academyName,
        value: String(a.academyId),
      })),
    },

    {
      name: "classification",
      label: "Classification (Activity Type)",
      type: "text",
      disabled: true,
    },

    {
      name: "courseType",
      label: "Course Type",
      type: "select",
      required: true,
      options: courseTypeOptions.map((c) => ({
        label: c.value,
        value: c.value,
      })),
    },
    {
      name: "introduceDate",
      label: "Introduce Date",
      type: "Date",
      required: true,
    },
    { name: "suspensionDate", label: "Suspension Date", type: "Date" },

    {
      name: "chargingPattern",
      label: "Charging Pattern",
      type: "select",
      options: [
        { label: "Unit", value: "Unit" },
        { label: "Day", value: "Day" },
        { label: "Session", value: "Session" },
      ],
    },

    { name: "sessionMinutes", label: "Session Minutes", type: "number" },
    { name: "noOfDaysInWeek", label: "Days Per Week", type: "number" },

    {
      name: "availabilityPattern",
      label: "Available On",
      type: "multiselect",
      options: WEEKDAY_OPTIONS,
      required: true,
    },

    {
      name: "minEnrollmentUnits",
      label: "Min Enrollment Units",
      type: "number",
    },
    { name: "batchCapacity", label: "Batch Capacity", type: "number" },
    {
      name: "totalParallelBatches",
      label: "Parallel Batches",
      type: "number",
    },

    { name: "minAge", label: "Min Age", type: "number" },
    { name: "maxAge", label: "Max Age", type: "number" },

    {
      name: "gender",
      label: "Gender",
      type: "select",
      options: [
        { label: "Male", value: "Male" },
        { label: "Female", value: "Female" },
        { label: "Any", value: "Any" },
      ],
    },

    { name: "changable", label: "Changable", type: "checkbox" },
    {
      name: "freezingAllowed",
      label: "Freezing Allowed (days)",
      type: "number",
    },
  ];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
        <FormHeader
          title={initialData ? "Edit Course" : "Add Course"}
          onClose={onClose}
        />

        <div className="overflow-auto max-h-[50vh]">
          {error && (
            <div className="m-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          <FormContent
            fields={fields}
            values={values}
            errors={errors}
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
          submitLabel={initialData ? "Update" : "Create"}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
