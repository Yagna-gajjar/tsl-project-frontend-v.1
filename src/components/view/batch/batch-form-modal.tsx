import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import { createBatch, editBatch } from "@/api/batch.api";
import { getCourses } from "@/api/course.api";
import { getAcademies } from "@/api/academy.api";
import type { Batch } from "@/types/batch";
import { toast } from "@/hooks/use-toast";
import { format as dfFormat } from "date-fns";
import type { Response } from "@/types/response";
import { getActivities } from "@/api/activity.api";
import type { Activity } from "@/types/activity";
import { getEnumsByCategory } from "@/api/enums.api";
import type { Enums } from "@/types/enums";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Batch> | null;
  onSaved?: (row: Batch) => void;
  layout?: "grid" | "list";
};

export function BatchFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSaved,
  layout = "grid",
}: Props) {
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

  const normalizeTimeToHHmm = (t: any): string | undefined => {
    if (t === undefined || t === null) return undefined;
    if (typeof t === "string") {
      const trimmed = t.trim();
      const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(trimmed);
      if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
      return trimmed;
    }
    if (t instanceof Date) {
      if (Number.isNaN(t.getTime())) return undefined;
      return dfFormat(t, "HH:mm");
    }
    const maybeDate = new Date(t);
    if (!Number.isNaN(maybeDate.getTime())) {
      return dfFormat(maybeDate, "HH:mm");
    }
    return undefined;
  };

  const formatDateInput = (d: any): string | undefined => {
    if (d === undefined || d === null) return undefined;
    const dt = typeof d === "string" ? new Date(d) : d;
    if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) return undefined;
    return dfFormat(dt, "yyyy-MM-dd");
  };

  const timeToMinutes = (t: any): number | null => {
    const hhmm = normalizeTimeToHHmm(t);
    if (!hhmm) return null;
    const [hh, mm] = hhmm.split(":").map((n) => Number(n));
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    return hh * 60 + mm;
  };

  const addMinutesToTime = (
    t: any,
    minutesToAdd: number
  ): string | undefined => {
    const base = timeToMinutes(t);
    if (base === null || !Number.isFinite(minutesToAdd)) return undefined;
    let total = base + minutesToAdd;
    const dayMinutes = 24 * 60;
    total = ((total % dayMinutes) + dayMinutes) % dayMinutes;
    const hh = Math.floor(total / 60);
    const mm = total % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  const formatTimeInput = (t: any): string | undefined => {
    if (t === undefined || t === null) return undefined;
    return normalizeTimeToHHmm(t);
  };

  const [activityOptions, setActivityOptions] = useState<Activity[]>([]);

  const getAllActivity = async () => {
    try {
      const response: Response<Activity[]> = await getActivities({ limit: 100 });
      const items = response?.data || [];

      setActivityOptions(items);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch activities",
        variant: "destructive",
      });
      setActivityOptions([]);
    }
  };

  const empty: Partial<Batch> = {
    batchName: initialData?.batchName ?? "",
    academyId: initialData?.academyId ?? undefined,
    courseId: initialData?.courseId ?? undefined,
    maxCapacity: initialData?.batchCapacity ?? undefined,
    activityName: initialData?.activityName ?? undefined,
    introduceDate: formatDateInput(initialData?.introduceDate) ?? undefined,
    suspendedDate: formatDateInput(initialData?.suspendedDate) ?? undefined,
    startTime: formatTimeInput(initialData?.startTime) ?? undefined,
    endTime: formatTimeInput(initialData?.endTime) ?? undefined,
    weekDays: numberToWeekArray(initialData?.weekDays as any) ?? [],
    status: (initialData?.status ?? "active") as "active" | "suspended",
  };

  const isEdit = Boolean(initialData && initialData.batchId);
  const [values, setValues] = useState<Partial<Batch>>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [academies, setAcademies] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [courses, setCourses] = useState<
    Array<{
      id: number;
      name: string;
      sessionMinutes?: number;
      weekDays?: number | string | null;
      maxCapacity?: number | null;
    }>
  >([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [batchType, setBatchType] = useState<Enums[]>([]);

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

  useEffect(() => {
    if (!isOpen) return;

    const loadTopOptions = async () => {
      setLoadingOptions(true);
      try {
        await getAllActivity();

        if (initialData?.activityName) {
          await loadAcademiesByActivity(String(initialData.activityName));
        }
      } catch (err) {
        console.error("Failed to load top-level options:", err);
        toast({
          title: "Error",
          description: "Failed to load options",
          variant: "destructive",
        });
      } finally {
        setLoadingOptions(false);
      }
    };

    loadTopOptions();
  }, [isOpen]);

  // safer loadBatchType
  const loadBatchType = useCallback(async () => {
    try {
      const res: Response<Enums[]> = await getEnumsByCategory("batchType");

      // Defensive: ensure we got an array
      const items = Array.isArray((res as any)?.data) ? (res as any).data : [];

      setBatchType(items);

      if (!res?.success) {
        // still show a toast but don't crash the UI
        toast({
          title: "Warning",
          description: "Failed to fetch enum (server returned error)",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Failed",
        description: "failed to fetch enum",
        variant: "destructive",
      });
      setBatchType([]);
    }
  }, []);

  const loadAcademiesByActivity = useCallback(async (activityName?: string) => {
    try {
      setLoadingOptions(true);
      const academiesData = await getAcademies({
        academyType: activityName,
        limit: 100,
      });
      console.log(academiesData, "pppjas");
      const academyArr = Array.isArray(
        (academiesData as any)?.data ?? academiesData
      )
        ? (academiesData as any)?.data ?? academiesData
        : [];
      setAcademies(
        academyArr.map((a: any) => ({ id: a.academyId, name: a.academyName }))
      );
    } catch (err) {
      console.error("Failed to load academies for activity:", err);
      setAcademies([]);
      toast({
        title: "Error",
        description: "Failed to load academies",
        variant: "destructive",
      });
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  const loadCourses = useCallback(async (academyId?: number | string) => {
    try {
      const id = academyId ? Number(academyId) : undefined;
      const coursesData = await getCourses({ academyId: id });

      const coursesArr = Array.isArray(
        (coursesData as any)?.data ?? coursesData
      )
        ? (coursesData as any)?.data ?? coursesData
        : [];

      setCourses(
        coursesArr.map((c: any) => ({
          id: c.courseId,
          name: c.courseName,
          sessionMinutes: c.sessionMinutes,
          weekDays: c.weekDays,
          maxCapacity: c.batchCapacity,
        }))
      );
    } catch (err) {
      console.error("Failed to load courses", err);
      setCourses([]);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    }
  }, []);

  useEffect(() => {
    const mapped = {
      ...empty,
      ...(initialData && {
        batchName: initialData.batchName ?? empty.batchName,
        academyId: initialData.academyId ?? empty.academyId,
        courseId: initialData.courseId ?? empty.courseId,
        activityName: initialData.activityName ?? empty.activityName,
        introduceDate:
          formatDateInput(initialData?.introduceDate) ?? empty.introduceDate,
        suspendedDate:
          formatDateInput(initialData?.suspendedDate) ?? empty.suspendedDate,
        startTime: formatTimeInput(initialData?.startTime) ?? empty.startTime,
        endTime: formatTimeInput(initialData?.endTime) ?? empty.endTime,
        weekDays:
          numberToWeekArray(initialData?.weekDays as any) ?? empty.weekDays,
        status: initialData?.status ?? empty.status,
      }),
    };

    loadBatchType();

    getAllActivity();
    setValues(mapped);
    setFieldErrors({});
    setError(null);
  }, [initialData, isOpen]);

  const onChange = (field: keyof Batch, val: any) => {
    if (field === "activityName") {
      const activityName = val ? String(val) : undefined;
      setValues((p) => ({
        ...p,
        activityName,
        academyId: undefined,
        courseId: undefined,
      }));
      setAcademies([]);
      if (activityName) {
        loadAcademiesByActivity(activityName);
      }
      setFieldErrors((prev) => {
        if (!prev.activityName) return prev;
        const copy = { ...prev };
        delete copy.activityName;
        return copy;
      });
      return;
    }

    if (field === "academyId") {
      const academyId = val ? Number(val) : undefined;
      setValues((p) => ({
        ...p,
        academyId,
        courseId: undefined,
      }));
      loadCourses(academyId);
      setFieldErrors((prev) => {
        if (!prev.academyId) return prev;
        const copy = { ...prev };
        delete copy.academyId;
        return copy;
      });
      return;
    }

    if (field === "courseId") {
      const courseIdVal = val ? Number(val) : undefined;
      const selectedCourse = courseIdVal
        ? courses.find((c) => Number(c.id) === Number(courseIdVal))
        : undefined;

      setValues((prev: any) => {
        let nextWeekDays = prev.weekDays;
        if (selectedCourse && selectedCourse.weekDays != null) {
          const auto = numberToWeekArray(selectedCourse.weekDays as any);
          if (auto.length > 0) {
            nextWeekDays = auto;
          }
        }

        let nextEndTime = prev.endTime;
        if (
          selectedCourse &&
          typeof selectedCourse.sessionMinutes === "number" &&
          prev.startTime
        ) {
          nextEndTime = addMinutesToTime(
            prev.startTime,
            selectedCourse.sessionMinutes
          );
        }
        let maxCapacity: number | null | undefined = prev.maxCapacity
          ? prev.maxCapacity
          : null;
        if (selectedCourse) {
          maxCapacity = selectedCourse.maxCapacity;
        }

        return {
          ...prev,
          courseId: courseIdVal,
          weekDays: nextWeekDays,
          endTime: nextEndTime,
          maxCapacity: maxCapacity,
        };
      });

      setFieldErrors((prev) => {
        if (!prev.courseId) return prev;
        const copy = { ...prev };
        delete copy.courseId;
        return copy;
      });
      return;
    }

    if (field === "weekDays") {
      const newVal = Array.isArray(val) ? val : val ? [val] : [];
      setValues((p) => ({ ...p, weekDays: newVal }));
      setFieldErrors((prev) => {
        if (!prev.weekDays) return prev;
        const copy = { ...prev };
        delete copy.weekDays;
        return copy;
      });
      return;
    }

    if (field === "startTime") {
      const newStart = val;
      setValues((prev) => {
        let nextEndTime = prev.endTime;

        if (prev.courseId) {
          const selectedCourse = courses.find(
            (c) => Number(c.id) === Number(prev.courseId)
          );
          if (
            selectedCourse &&
            typeof selectedCourse.sessionMinutes === "number"
          ) {
            nextEndTime = addMinutesToTime(
              newStart,
              selectedCourse.sessionMinutes
            );
          }
        }

        return {
          ...prev,
          startTime: newStart,
          endTime: nextEndTime,
        };
      });

      setFieldErrors((prev) => {
        if (!prev.startTime) return prev;
        const copy = { ...prev };
        delete copy.startTime;
        return copy;
      });
      return;
    }

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
    if (!values.batchName || String(values.batchName).trim() === "") {
      errs.batchName = "Batch name is required";
    }
    if (!values.activityName) {
      errs.activityName = "Activity is required";
    }
    if (!values.academyId) {
      errs.academyId = "Academy is required";
    }

    if (!values.startTime) {
      errs.startTime = "Start time is required";
    }
    if (!values.endTime) {
      errs.endTime = "End time is required";
    }

    if (
      !values.weekDays ||
      !Array.isArray(values.weekDays) ||
      values.weekDays.length < 1
    ) {
      errs.weekDays = "Select at least one weekday";
    }

    try {
      const startMin = timeToMinutes(values.startTime);
      const endMin = timeToMinutes(values.endTime);
      if (startMin === null) {
        errs.startTime = "Invalid start time";
      }
      if (endMin === null) {
        errs.endTime = "Invalid end time";
      }
      if (startMin !== null && endMin !== null && endMin < startMin) {
        errs.endTime = "End time cannot be before start time";
      }
    } catch { }

    try {
      const intro = values.introduceDate
        ? new Date(values.introduceDate as any)
        : null;
      const susp = values.suspendedDate
        ? new Date(values.suspendedDate as any)
        : null;
      if (intro && susp && susp < intro) {
        errs.suspendedDate = "Suspended date cannot be before introduce date";
      }
    } catch { }

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
      const normalizedStart = normalizeTimeToHHmm(values.startTime);
      const normalizedEnd = normalizeTimeToHHmm(values.endTime);

      const weekCode = weekArrayToNumber(values.weekDays as any[]);

      const payload: Partial<Batch> = {
        batchName: String(values.batchName ?? "").trim(),
        batchType: values.batchType,
        academyId: Number(values.academyId),
        courseId: values.courseId ? Number(values.courseId) : undefined,
        activityName: values.activityName
          ? String(values.activityName)
          : undefined,
        introduceDate: values.introduceDate
          ? new Date(values.introduceDate as any)
          : new Date(),
        suspendedDate: values.suspendedDate
          ? new Date(values.suspendedDate as any)
          : undefined,
        startTime: normalizedStart,
        endTime: normalizedEnd,
        weekDays: weekCode,
        status: values.status ?? "active",
      };

      let res: any;
      if (isEdit && initialData?.batchId) {
        res = await editBatch(Number(initialData.batchId), payload);
        toast({
          title: "Success",
          description: "Batch updated successfully",
          variant: "success",
        });
      } else {
        res = await createBatch(payload as Batch);
        toast({
          title: "Success",
          description: "Batch created successfully",
          variant: "success",
        });
      }

      const ok =
        typeof res?.success !== "undefined"
          ? res.success === true || String(res.success) === "true"
          : true;

      if (!ok) {
        const msg = res?.message ?? "Failed to save";
        setError(msg);

        toast({
          title: "Save failed",
          description: msg,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      onSaved?.(values as Batch);
      onClose();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save batch";
      setError(errorMsg);
      toast({
        variant: "destructive",
        description: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, isEdit, initialData, onSaved, onClose, validate]);

  const fields = [
    {
      name: "batchName",
      label: "Batch Name",
      type: "text",
      required: true,
    },
    {
      name: "batchType",
      label: "Batch Type",
      type: "select",
      options: batchType.map((b) => ({
        value: b.value,
        label: String(b.value),
      })),
      required: true,
    },
    {
      name: "activityName",
      label: "Activity",
      type: "select",
      options: activityOptions.map((a) => ({
        label: a.activityName,
        value: a.activityName,
      })),
      required: true,
    },
    {
      name: "academyId",
      label: "Academy",
      type: "select",
      required: true,
      options: academies.map((a) => ({ label: a.name, value: String(a.id) })),
      disabled: loadingOptions || !values.activityName,
    },
    {
      name: "courseId",
      label: "Course",
      type: "select",
      required: false,
      options: courses.map((c) => ({ label: c.name, value: String(c.id) })),
      disabled: loadingOptions || !values.academyId,
    },
    {
      name: "weekDays",
      label: "Week Days",
      type: "multiselect",
      required: true,
      options: WEEKDAY_OPTIONS,
    },
    {
      name: "startTime",
      label: "Start Time",
      type: "time",
      required: true,
    },
    {
      name: "endTime",
      label: "End Time",
      type: "time",
      required: true,
      disabled: !!values.courseId,
    },
    {
      name: "admissionCriteria",
      label: "Admission Criteria",
      type: "text",
    },
    {
      name: "maxCapacity",
      label: "Max Capacity",
      type: "text",
      required: true,
    },
    {
      name: "introduceDate",
      label: "Introduce Date",
      type: "Date",
    },
    {
      name: "suspendedDate",
      label: "Suspended Date",
      type: "Date",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { label: "Active", value: "active" },
        { label: "Suspended", value: "suspended" },
      ],
    },
  ] as any;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
        <div className="flex flex-col max-h-[90vh] overflow-hidden">
          <FormHeader
            title={isEdit ? "Edit Batch" : "Add Batch"}
            onClose={onClose}
          />
          <div className="flex-1 overflow-y-auto">
            <FormContent
              fields={fields}
              values={values}
              errors={fieldErrors}
              loading={loadingOptions}
              error={error}
              isSubmitting={isSubmitting}
              onChange={onChange}
              layout={layout}
            />
          </div>
          <FormFooter
            onClose={onClose}
            onSubmit={handleSubmit}
            submitLabel={isEdit ? "Update" : "Create"}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BatchFormModal;
