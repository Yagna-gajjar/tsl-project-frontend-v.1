import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import { createBatch, editBatch } from "@/api/batch.api";
import { getCourses } from "@/api/course.api";
import type { Batch } from "@/types/batch";
import { toast } from "@/hooks/use-toast";
import { format as dfFormat } from "date-fns";
import type { Response } from "@/types/response";
import { getActivities } from "@/api/activity.api";
import type { Activity } from "@/types/activity";
import { getEnumsByCategory } from "@/api/enums.api";
import type { Enums } from "@/types/enums";
import { getEntities } from "@/api/entity.api";
import type { Entity } from "@/types/entity";
import type { membership } from "@/types/membership";
import { getMemberships } from "@/api/membership.api";
import type { Course } from "@/types/course";

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
  const [membershipOptions, setMembershipOptions] = useState<membership[]>([]);
  const getAllActivityOptionFun = async () => {
    try {
      const response: Response<Activity[]> = await getActivities({
        limit: 200,
      });
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

  const getMembershipOptionFun = async () => {
    try {
      const res: Response<membership[]> = await getMemberships({
        limit: 200,
      });
      const items = res?.data || ([] as membership[]);
      setMembershipOptions(items);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch Membership",
        variant: "destructive",
      });
    }
  };

  const empty: Partial<Batch> = {
    batchType: initialData?.batchType ?? "",
    entityId: initialData?.entityId ?? undefined,
    activityId: initialData?.activityId ?? undefined,
    membershipId: initialData?.membershipId ?? undefined,
    courseId: initialData?.courseId ?? undefined,
    batchName: initialData?.batchName ?? "",
    introduceDate: formatDateInput(initialData?.introduceDate) ?? undefined,
    suspendedDate: formatDateInput(initialData?.suspendedDate) ?? undefined,
    maxCapacity: initialData?.maxCapacity ?? undefined,
    startTime: formatTimeInput(initialData?.startTime) ?? undefined,
    endTime: formatTimeInput(initialData?.endTime) ?? undefined,
    daysPerWeek: initialData?.daysPerWeek ?? 0,
    daysPattern: numberToWeekArray(initialData?.daysPattern as any) ?? [],
    admissionCriteria: initialData?.admissionCriteria ?? undefined,
    status: (initialData?.status ?? "active") as "active" | "suspended",
  };

  const isEdit = Boolean(initialData && initialData.batchId);
  const [values, setValues] = useState<Partial<Batch>>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [entity, setEntity] = useState<Entity[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
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
        await getAllActivityOptionFun();
        await getEntitiesOptionFun();
        await getMembershipOptionFun();
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

  const loadBatchType = useCallback(async () => {
    try {
      const res: Response<Enums[]> = await getEnumsByCategory("batchType");

      const items = Array.isArray(res?.data) ? res.data : [];

      setBatchType(items);

      if (!res?.success) {
        toast({
          title: "Warning",
          description: "Failed to fetch enum (server returned error)",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Failed",
        description: "failed to fetch enum",
        variant: "destructive",
      });
      setBatchType([]);
    }
  }, []);

  const getEntitiesOptionFun = useCallback(async () => {
    try {
      setLoadingOptions(true);
      const res: Response<Entity[]> = await getEntities({
        limit: 100,
      });
      const items = res?.data as Entity[];
      setEntity(items);
    } catch (err) {
      console.error("Failed to load academies for activity:", err);
      setEntity([]);
      toast({
        title: "Error",
        description: "Failed to load academies",
        variant: "destructive",
      });
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  const loadCourses = useCallback(async (activityId: number) => {
    try {
      const res: Response<Course[]> = await getCourses({
        activityId: activityId,
      });

      const items = res?.data as Course[];
      setCourses(items);
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
        batchType: initialData.batchType ?? empty.batchType,
        entityId: initialData.entityId ?? empty.entityId,
        activityId: initialData.activityId ?? empty.activityId,
        membershipId: initialData.membershipId ?? empty.membershipId,
        courseId: initialData.courseId ?? empty.courseId,
        batchName: initialData.batchName ?? empty.batchName,
        introduceDate:
          formatDateInput(initialData?.introduceDate) ?? empty.introduceDate,
        suspendedDate:
          formatDateInput(initialData?.suspendedDate) ?? empty.suspendedDate,
        maxCapacity: initialData.maxCapacity ?? empty.maxCapacity,
        startTime: formatTimeInput(initialData?.startTime) ?? empty.startTime,
        endTime: formatTimeInput(initialData?.endTime) ?? empty.endTime,
        daysPattern:
          numberToWeekArray(initialData?.daysPattern as any) ??
          empty.daysPattern,
        admissionCriteria:
          initialData.admissionCriteria ?? empty.admissionCriteria,
        status: initialData?.status ?? empty.status,
      }),
    };

    loadBatchType();

    getAllActivityOptionFun();
    setValues(mapped);
    setFieldErrors({});
    setError(null);
  }, [initialData, isOpen]);

  const onChange = (field: keyof Batch, val: any) => {
    if (field === "activityId") {
      const activityId = val ? Number(val) : undefined;
      setValues((p) => ({
        ...p,
        activityId,
        courseId: undefined,
      }));
      loadCourses(activityId ?? 0);
      setFieldErrors((prev) => {
        if (!prev.activityId) return prev;
        const copy = { ...prev };
        delete copy.activityId;
        return copy;
      });
      return;
    }
    if (field === "courseId") {
      const courseIdVal = val ? Number(val) : undefined;
      const selectedCourse = courseIdVal
        ? courses.find((c) => Number(c.courseId) === Number(courseIdVal))
        : undefined;

      setValues((prev: any) => {
        let daysPattern = prev.daysPattern;
        if (selectedCourse && selectedCourse.daysPattern != null) {
          const auto = numberToWeekArray(selectedCourse.daysPattern as any);
          if (auto.length > 0) {
            daysPattern = auto;
          }
        }
        let sessionMinutes = prev.sessionMinutes;
        if (selectedCourse) {
          sessionMinutes = selectedCourse.sessionMinutes;
        }
        let nextEndTime = prev.endTime;
        if (selectedCourse && prev.startTime) {
          nextEndTime = addMinutesToTime(
            prev.startTime,
            selectedCourse.sessionMinutes
          );
        }

        let maxCapacity: number | null | undefined = prev.maxCapacity
          ? prev.maxCapacity
          : null;
        if (selectedCourse) {
          maxCapacity = selectedCourse.batchCapacity;
        }

        let daysPerWeek: number | null | undefined = prev.daysPerWeek
          ? prev.daysPerWeek
          : null;
        if (selectedCourse) {
          daysPerWeek = selectedCourse.noOfDaysInWeek;
        }

        return {
          ...prev,
          courseId: courseIdVal,
          sessionMinutes: sessionMinutes,
          daysPerWeek: daysPerWeek,
          daysPattern: daysPattern,
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
    if (field === "entityId") {
      const entityId = val ? Number(val) : undefined;
      setValues((p) => ({
        ...p,
        entityId,
      }));
      setFieldErrors((prev) => {
        if (!prev.entityId) return prev;
        const copy = { ...prev };
        delete copy.entityId;
        return copy;
      });
      return;
    }

    if (field === "daysPattern") {
      const newVal = Array.isArray(val) ? val : val ? [val] : [];
      setValues((p) => ({ ...p, daysPattern: newVal }));
      setFieldErrors((prev) => {
        if (!prev.daysPattern) return prev;
        const copy = { ...prev };
        delete copy.daysPattern;
        return copy;
      });
      return;
    }

    if (field === "startTime") {
      setValues((prev) => {
        const nextEndTime = addMinutesToTime(
          val, // ✅ use new startTime
          Number(prev.sessionMinutes)
        );

        return {
          ...prev,
          startTime: val,
          endTime: nextEndTime,
        };
      });

      setValues((p) => ({ ...p, [field]: val }));
      setFieldErrors((prev) => {
        if (!prev[field as string]) return prev;
        const copy = { ...prev };
        delete copy[field as string];
        return copy;
      });
    }
    setValues((p) => ({ ...p, [field]: val }));

  };

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!values.batchName || String(values.batchName).trim() === "") {
      errs.batchName = "Batch name is required";
    }
    if (!values.activityId) {
      errs.activityId = "Activity is required";
    }
    if (!values.entityId) {
      errs.entityId = "entity is required";
    }

    if (!values.startTime) {
      errs.startTime = "Start time is required";
    }
    if (!values.endTime) {
      errs.endTime = "End time is required";
    }

    if (
      !values.daysPattern ||
      !Array.isArray(values.daysPattern) ||
      values.daysPattern.length < 1
    ) {
      errs.daysPattern = "Select at least one weekday";
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
    } catch {}

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
    } catch {}

    return errs;
  }, [values]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    const errs = validate();
    console.log(errs);
    
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setIsSubmitting(false);
      return;
    }

    try {
      const normalizedStart = normalizeTimeToHHmm(values.startTime);
      const normalizedEnd = normalizeTimeToHHmm(values.endTime);

      const weekCode = weekArrayToNumber(values.daysPattern as any[]);

      const payload: Partial<Batch> = {
        batchType: values.batchType,
        entityId: Number(values.entityId),
        activityId: values.activityId ? Number(values.activityId) : undefined,
        membershipId: Number(values.membershipId),
        courseId: values.courseId ? Number(values.courseId) : undefined,
        batchName: String(values.batchName ?? "").trim(),
        introduceDate: values.introduceDate
          ? new Date(values.introduceDate as any)
          : new Date(),
        suspendedDate: values.suspendedDate
          ? new Date(values.suspendedDate as any)
          : undefined,
        maxCapacity: Number(values.maxCapacity),
        startTime: normalizedStart,
        endTime: normalizedEnd,
        daysPerWeek: Number(values.daysPerWeek),
        daysPattern: weekCode,
        admissionCriteria: values.admissionCriteria,
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
      name: "batchType",
      label: "Batch Type",
      type: "select",
      options: batchType?.map((b) => ({
        value: b.value,
        label: String(b.value),
      })),
      required: true,
    },
    {
      name: "batchName",
      label: "Batch Name",
      type: "text",
      required: true,
    },
    {
      name: "activityId",
      label: "Activity",
      type: "select",
      options: activityOptions?.map((a) => ({
        label: a.activityName,
        value: a.activityId,
      })),
      required: true,
    },
    {
      name: "courseId",
      label: "Course",
      type: "select",
      required: false,
      options: courses?.map((c) => ({
        label: c.courseName,
        value: c.courseId,
      })),
      disabled: loadingOptions,
    },
    {
      name: "entityId",
      label: "entity",
      type: "select",
      required: true,
      options: entity?.map((a) => ({
        label: a.entityName,
        value: a.entityId,
      })),
      disabled: loadingOptions,
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
      name: "membershipId",
      label: "membership",
      type: "select",
      options: membershipOptions?.map((m) => ({
        label: m.startDate + "-" + m.endDate,
        value: m.membershipId,
      })),
      required: true,
    },
    {
      name: "maxCapacity",
      label: "Max Capacity",
      type: "number",
      required: true,
    },
    {
      name: "sessionMinutes",
      label: "Session Minutes",
      type: "number",
      required: true,
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
      name: "daysPerWeek",
      label: "Days Per Week",
      type: "number",
      required: true,
    },
    {
      name: "daysPattern",
      label: "Week Days",
      type: "multiselect",
      required: true,
      options: WEEKDAY_OPTIONS,
    },
    {
      name: "admissionCriteria",
      label: "Admission Criteria",
      type: "text",
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
        <div className="flex flex-col max-h-[70vh] overflow-hidden">
          <FormHeader
            title={isEdit ? "Edit Batch" : "Add Batch"}
            onClose={onClose}
          />
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
      </DialogContent>
    </Dialog>
  );
}
  

export default BatchFormModal;
