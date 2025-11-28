import { useCallback, useEffect, useState } from "react";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import { createCourse, updateCourse } from "@/api/course.api";
import type { Course } from "@/types/course";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getAcademies } from "@/api/academy.api";
import { getActivities } from "@/api/activity.api";
import type { Response } from "@/types/response";
import { format } from "date-fns";

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
  introductionDate: new Date(),
  suspendDate: undefined,
  courseName: "",
  typeOfCourse: "",
  minEnrollmentUnit: 1,
  totalParallelBatches: 1,
  classificationType: "Member Credits",
  chargingPattern: "Unit",
  sessionMinutes: 30,
  noOfDaysInWeek: 0,
  weekDays: [],
  unitRate: 0,
  batchCapacity: 1,
  minAge: 1,
  maxAge: 100,
  gender: "Male",
  status: "active",
} as unknown as Course;

export default function CourseFormModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [values, setValues] = useState<Course>(initialData ?? empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [activityOptions, setActivityOptions] = useState<any[]>([]);
  const [academyOptions, setAcademyOptions] = useState<any[]>([]);
  useEffect(() => {
    const loadData = async () => {
      if (initialData) {
        const init = {
          ...initialData,
          introductionDate: format(initialData?.introductionDate, "yyyy-MM-dd"),
          suspendDate: format(initialData?.suspendDate, "yyyy-MM-dd"),
        } as any;
        if (typeof init.weekDays === "string" && init.weekDays.length > 0) {
          // split each character and convert to number
          init.weekDays = init.weekDays
            .split("")
            .map((s: string) => Number(s))
            .filter((n: number) => Number.isFinite(n));
        }
        setValues(init);
        console.log(init, "opop");
      } else {
        // ensure default active status for new course
        setValues({ ...empty, status: "active" } as Course);
      }
      setFieldErrors({});
      setError(null);

      const [resActivity, resAcademy] = await Promise.all([
        getActivities(),
        getAcademies(),
      ]);
      const activityopts = Array.isArray(resActivity.data)
        ? resActivity.data.map((activity: any) => ({
            value: activity.activityId,
            label: activity.activityName,
          }))
        : [];

      const academyopts = Array.isArray(resAcademy)
        ? resAcademy.map((academy: any) => ({
            value: academy.academyId,
            label: academy.academyName,
          }))
        : [];
      setActivityOptions(activityopts);
      setAcademyOptions(academyopts);
    };

    loadData();
  }, [initialData, isOpen]);

  const onChange = (field: keyof Course, val: any) => {
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

    // required string fields
    if (!values.courseName || String(values.courseName).trim() === "") {
      errs.courseName = "Course name is required";
    }
    if (!values.typeOfCourse || String(values.typeOfCourse).trim() === "") {
      errs.typeOfCourse = "Type of course is required";
    }

    // required numeric fields and non-negative checks
    const numericFields: Array<{ key: keyof Course; label: string }> = [
      { key: "minEnrollmentUnit", label: "Minimum enrollment unit" },
      { key: "totalParallelBatches", label: "Total parallel batches" },
      { key: "sessionMinutes", label: "Session minutes" },
      { key: "noOfDaysInWeek", label: "No. of days in week" },
      { key: "unitRate", label: "Unit rate" },
      { key: "batchCapacity", label: "Batch capacity" },
    ];

    numericFields.forEach((f) => {
      const val = Number((values as any)[f.key]);
      if (Number.isNaN(val) || val === undefined || val === null) {
        errs[f.key as string] = `${f.label} is required`;
      } else if (val < 0) {
        errs[f.key as string] = `${f.label} must be 0 or greater`;
      }
    });

    // ages
    const minAge = Number((values as any).minAge);
    const maxAge = Number((values as any).maxAge);
    if (!Number.isFinite(minAge) || minAge < 1) {
      errs.minAge = "Minimum age is required and must be at least 1";
    }
    if (!Number.isFinite(maxAge) || maxAge > 100) {
      errs.maxAge = "Maximum age is required and must be at most 100";
    }
    if (Number.isFinite(minAge) && Number.isFinite(maxAge) && minAge > maxAge) {
      errs.minAge = "Minimum age cannot be greater than maximum age";
      errs.maxAge = "Maximum age cannot be less than minimum age";
    }

    // dates
    if (!values.introductionDate) {
      errs.introductionDate = "Introduction date is required";
    }
    // suspendDate is intentionally optional (no validation)

    // enums
    if (
      !values.classificationType ||
      values.classificationType === undefined ||
      values.classificationType === null
    ) {
      errs.classificationType = "Classification type is required";
    }
    if (
      !values.chargingPattern ||
      values.chargingPattern === undefined ||
      values.chargingPattern === null
    ) {
      errs.chargingPattern = "Charging pattern is required";
    }
    if (
      !values.gender ||
      values.gender === undefined ||
      values.gender === null
    ) {
      errs.gender = "Gender is required";
    }
    if (
      !values.status ||
      values.status === undefined ||
      values.status === null
    ) {
      errs.status = "Status is required";
    }

    // academy/activity selection
    if (
      values.academyId === undefined ||
      values.academyId === null ||
      values.academyId === 0
    ) {
      errs.academyId = "Academy is required";
    }
    if (
      values.activityId === undefined ||
      values.activityId === null ||
      values.activityId === 0
    ) {
      errs.activityId = "Activity is required";
    }

    if (
      !values.totalParallelBatches ||
      values.totalParallelBatches === undefined ||
      values.totalParallelBatches === null ||
      values.totalParallelBatches === 0
    ) {
      errs.totalParallelBatches = "total parallel baches is required";
    }

    if (
      !values.minEnrollmentUnit ||
      values.minEnrollmentUnit === undefined ||
      values.minEnrollmentUnit === null ||
      values.minEnrollmentUnit === 0
    ) {
      errs.minEnrollmentUnit = "in Enrollment Unit is required";
    }
    if (
      !values.sessionMinutes ||
      values.sessionMinutes === undefined ||
      values.sessionMinutes === null ||
      values.sessionMinutes <= 0
    ) {
      errs.sessionMinutes = "Session Minutes is required";
    }
    if (
      !values.noOfDaysInWeek ||
      values.noOfDaysInWeek === undefined ||
      values.noOfDaysInWeek === null ||
      values.noOfDaysInWeek <= 0
    ) {
      errs.noOfDaysInWeek = "No. Of Days In Week is required";
    }
    if (
      !values.weekDays ||
      values.weekDays === undefined ||
      values.weekDays === null ||
      values.weekDays <= 0
    ) {
      errs.weekDays = "Week Days is required";
    }
    if (
      !values.unitRate ||
      values.unitRate === undefined ||
      values.unitRate === null ||
      values.unitRate < 0
    ) {
      errs.unitRate = "Unit Rate is required";
    }
    if (
      !values.batchCapacity ||
      values.batchCapacity === undefined ||
      values.batchCapacity === null ||
      values.batchCapacity <= 0
    ) {
      errs.batchCapacity = "Batch Capacity is required";
    }

    // weekDays logic: if noOfDaysInWeek > 0 then weekDays must be an array with exact selection count
    if (Number((values as any).noOfDaysInWeek) > 0) {
      const wd = (values as any).weekDays;
      if (!Array.isArray(wd) || wd.length === 0) {
        errs.weekDays = "Select weekday(s)";
      } else if (
        Array.isArray(wd) &&
        wd.length !== Number((values as any).noOfDaysInWeek)
      ) {
        errs.weekDays = `Select exactly ${Number(
          (values as any).noOfDaysInWeek
        )} day(s)`;
      }
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
      // convert weekDays to required string format:
      // user selects weekdays with values 1..7 (Mon=1 ... Sun=7)
      let weekDaysValue: string | undefined;
      if (Array.isArray((values as any).weekDays)) {
        const arr = (values as any).weekDays
          .map((v: any) => Number(v))
          .filter((n: number) => Number.isFinite(n))
          .sort((a: number, b: number) => a - b);
        weekDaysValue = arr.join("");
      } else if (
        (values as any).weekDays !== undefined &&
        (values as any).weekDays !== null
      ) {
        // if it's a single number, convert to string
        weekDaysValue = String((values as any).weekDays);
      }

      const payload: Partial<Course> = {
        academyId: values.academyId || undefined,
        activityId: values.activityId || undefined,
        courseName: values.courseName,
        introductionDate: values.introductionDate,
        suspendDate: values.suspendDate,
        typeOfCourse: values.typeOfCourse,
        minEnrollmentUnit: values.minEnrollmentUnit,
        totalParallelBatches: values.totalParallelBatches,
        classificationType: values.classificationType,
        chargingPattern: values.chargingPattern,
        sessionMinutes: values.sessionMinutes,
        noOfDaysInWeek: values.noOfDaysInWeek,
        // send weekDays as the compact string (e.g. Monday,Wed,Fri -> "135")
        weekDays: weekDaysValue as any,
        unitRate: values.unitRate,
        batchCapacity: values.batchCapacity,
        minAge: values.minAge,
        maxAge: values.maxAge,
        gender: values.gender,
        status: values.status,
      } as Partial<Course>;

      if (initialData?.courseId) {
        await updateCourse(
          initialData.courseId,
          payload as Omit<Course, "courseId" | "createdAt" | "updatedAt">
        );
      } else {
        const res: Response = await createCourse(
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

  // week starts from Monday = 1 ... Sunday = 7
  const weekdayOptions = [
    { label: "Monday", value: 1 },
    { label: "Tuesday", value: 2 },
    { label: "Wednesday", value: 3 },
    { label: "Thursday", value: 4 },
    { label: "Friday", value: 5 },
    { label: "Saturday", value: 6 },
    { label: "Sunday", value: 7 },
  ];

  // dynamic fields: weekDays becomes multiselect when noOfDaysInWeek > 0
  const fieldsBase: any[] = [
    { name: "courseName", label: "Course Name", type: "text", required: true },
    {
      name: "academyId",
      label: "Academy Name",
      type: "select",
      options: academyOptions,
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
      name: "introductionDate",
      label: "Introduction Date",
      type: "Date",
      required: true,
    },
    {
      name: "suspendDate",
      label: "Suspend Date",
      type: "Date",
      required: false,
    },
    {
      name: "typeOfCourse",
      label: "Type Of Course",
      type: "text",
      required: true,
    },
    {
      name: "minEnrollmentUnit",
      label: "Minimum Enrollment Unit",
      type: "number",
      required: true,
    },
    {
      name: "totalParallelBatches",
      label: "Total Parallel Batches",
      type: "number",
      required: true,
    },
    {
      name: "classificationType",
      label: "Classification Type",
      type: "select",
      options: [
        { label: "Member Credits", value: "Member Credits" },
        { label: "Fees Only", value: "Fees Only" },
      ],
      required: true,
    },
    {
      name: "chargingPattern",
      label: "Charging Pattern",
      type: "select",
      options: [
        { label: "Unit", value: "Unit" },
        { label: "Day", value: "Day" },
        { label: "Session", value: "Session" },
      ],
      required: true,
    },
    {
      name: "sessionMinutes",
      label: "Session Minutes",
      type: "number",
      required: true,
    },
    {
      name: "noOfDaysInWeek",
      label: "No Of Days In Week",
      type: "number",
      required: true,
    },
  ];

  const weekDaysField =
    Number((values as any).noOfDaysInWeek) > 0
      ? {
          name: "weekDays",
          label: "Week Days",
          type: "multiselect",
          options: weekdayOptions,
          required: true,
        }
      : {
          name: "weekDays",
          label: "Week Days",
          type: "number",
          required: true,
        };

  const remainingFields: any[] = [
    weekDaysField,
    { name: "unitRate", label: "Unit Rate", type: "number", required: true },
    {
      name: "batchCapacity",
      label: "Batch Capacity",
      type: "number",
      required: true,
    },
    { name: "minAge", label: "Minimum Age", type: "number", required: true },
    { name: "maxAge", label: "Maximum Age", type: "number", required: true },
    {
      name: "gender",
      label: "Gender",
      type: "select",
      options: [
        { label: "Male", value: "Male" },
        { label: "Female", value: "Female" },
        { label: "Couple", value: "Couple" },
        { label: "Open", value: "Open" },
      ],
      required: true,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "active", value: "active" },
        { label: "suspended", value: "suspended" },
      ],
      required: true,
      disabled: !initialData, // disabled for adding new course
    },
  ];

  const fields = [...fieldsBase, ...remainingFields];

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
                    value: string | number | boolean | Date | undefined
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
