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
  // --- Helper Functions (Keep Original) ---
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

  // --- Pagination & Data State ---
  const [activityOptions, setActivityOptions] = useState<Activity[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [hasMoreActivities, setHasMoreActivities] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const [membershipOptions, setMembershipOptions] = useState<membership[]>([]);
  const [membershipPage, setMembershipPage] = useState(1);
  const [hasMoreMemberships, setHasMoreMemberships] = useState(true);
  const [loadingMemberships, setLoadingMemberships] = useState(false);

  const [entityOptions, setEntityOptions] = useState<Entity[]>([]);
  const [entityPage, setEntityPage] = useState(1);
  const [hasMoreEntities, setHasMoreEntities] = useState(true);
  const [loadingEntities, setLoadingEntities] = useState(false);

  const PAGE_SIZE = 20;

  // --- API Fetchers with Infinite Scroll Support ---
  const fetchActivities = async (isInitial = false) => {
    if (loadingActivities || (!hasMoreActivities && !isInitial)) return;
    setLoadingActivities(true);
    try {
      const page = isInitial ? 1 : activityPage;
      const response = await getActivities({
        limit: PAGE_SIZE,
        page: page,
      });
      const items = response?.data || [];
      setActivityOptions((prev) => (isInitial ? items : [...prev, ...items]));
      setHasMoreActivities(items.length === PAGE_SIZE);
      setActivityPage(page + 1);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch activities",
        variant: "destructive",
      });
    } finally {
      setLoadingActivities(false);
    }
  };

  const fetchMemberships = async (isInitial = false) => {
    if (loadingMemberships || (!hasMoreMemberships && !isInitial)) return;
    setLoadingMemberships(true);
    try {
      const page = isInitial ? 1 : membershipPage;
      const res = await getMemberships({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      const items = res?.data || [];
      setMembershipOptions((prev) => (isInitial ? items : [...prev, ...items]));
      setHasMoreMemberships(items.length === PAGE_SIZE);
      setMembershipPage(page + 1);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch memberships",
        variant: "destructive",
      });
    } finally {
      setLoadingMemberships(false);
    }
  };

  const fetchEntities = async (isInitial = false) => {
    if (loadingEntities || (!hasMoreEntities && !isInitial)) return;
    setLoadingEntities(true);
    try {
      const page = isInitial ? 1 : entityPage;
      const res = await getEntities({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      const items = res?.data || [];
      setEntityOptions((prev) => (isInitial ? items : [...prev, ...items]));
      setHasMoreEntities(items.length === PAGE_SIZE);
      setEntityPage(page + 1);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch entities",
        variant: "destructive",
      });
    } finally {
      setLoadingEntities(false);
    }
  };

  const [batchTypeOptions, setBatchTypeOptions] = useState<Enums[]>([]);
  const loadBatchType = async () => {
    try {
      const res = await getEnumsByCategory("batchType");
      setBatchTypeOptions(res?.data || []);
    } catch {
      setBatchTypeOptions([]);
    }
  };

  const [courses, setCourses] = useState<Course[]>([]);
  const loadCourses = async (activityId: number) => {
    try {
      const res = await getCourses({ activityId });
      setCourses(res?.data || []);
    } catch {
      setCourses([]);
    }
  };

  // --- Form State ---
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
    if (isOpen) {
      setValues({ ...empty, ...initialData });
      loadBatchType();
      fetchActivities(true);
      fetchEntities(true);
      fetchMemberships(true);
      if (initialData?.activityId) loadCourses(Number(initialData.activityId));
    }
  }, [isOpen, initialData]);

  // --- Handlers ---
  const onChange = (field: keyof Batch, val: any) => {
    if (field === "activityId") {
      const activityId = val ? Number(val) : undefined;
      setValues((p) => ({ ...p, activityId, courseId: undefined }));
      if (activityId) loadCourses(activityId);
      return;
    }

    if (field === "courseId") {
      const courseIdVal = val ? Number(val) : undefined;
      const selectedCourse = courses.find(
        (c) => Number(c.courseId) === Number(courseIdVal)
      );
      setValues((prev: any) => ({
        ...prev,
        courseId: courseIdVal,
        sessionMinutes: selectedCourse?.sessionMinutes || prev.sessionMinutes,
        daysPerWeek: selectedCourse?.noOfDaysInWeek || prev.daysPerWeek,
        daysPattern: selectedCourse?.daysPattern
          ? numberToWeekArray(selectedCourse.daysPattern as any)
          : prev.daysPattern,
        endTime:
          selectedCourse && prev.startTime
            ? addMinutesToTime(prev.startTime, selectedCourse.sessionMinutes)
            : prev.endTime,
        maxCapacity: selectedCourse?.batchCapacity || prev.maxCapacity,
      }));
      return;
    }

    if (field === "startTime") {
      setValues((prev) => ({
        ...prev,
        startTime: val,
        endTime: addMinutesToTime(val, Number((prev as any).sessionMinutes)),
      }));
      return;
    }

    setValues((p) => ({ ...p, [field]: val }));
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[field as string];
      return copy;
    });
  };

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!values.batchName?.trim()) errs.batchName = "Batch name is required";
    if (!values.activityId) errs.activityId = "Activity is required";
    if (!values.entityId) errs.entityId = "Entity is required";
    if (!values.startTime) errs.startTime = "Start time is required";
    if (!values.endTime) errs.endTime = "End time is required";
    if (!Array.isArray(values.daysPattern) || values.daysPattern.length < 1)
      errs.daysPattern = "Select at least one weekday";
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
      const payload: Partial<Batch> = {
        ...values,
        entityId: Number(values.entityId),
        activityId: Number(values.activityId),
        membershipId: Number(values.membershipId),
        maxCapacity: Number(values.maxCapacity),
        daysPattern: weekArrayToNumber(values.daysPattern as any[]),
        introduceDate: values.introduceDate
          ? new Date(values.introduceDate as any)
          : new Date(),
      };

      let res = isEdit
        ? await editBatch(Number(initialData?.batchId), payload)
        : await createBatch(payload as Batch);

      if (res?.success || res?.data) {
        toast({
          title: "Success",
          description: `Batch ${isEdit ? "updated" : "created"}`,
          variant: "success",
        });
        onSaved?.(values as Batch);
        onClose();
      } else {
        throw new Error(res?.message || "Failed to save");
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, isEdit, initialData, onSaved, onClose, validate]);

  // --- Fields Configuration with Virtualization ---
  const fields = [
    {
      name: "batchType",
      label: "Batch Type",
      type: "select",
      options: batchTypeOptions.map((b) => ({
        value: b.value,
        label: String(b.value),
      })),
      required: true,
    },
    { name: "batchName", label: "Batch Name", type: "text", required: true },
    {
      name: "activityId",
      label: "Activity",
      type: "select",
      options: activityOptions.map((a) => ({
        label: a.activityName,
        value: a.activityId,
      })),
      required: true,
      onLoadMore: () => fetchActivities(),
      isLoadingMore: loadingActivities,
    },
    {
      name: "courseId",
      label: "Course",
      type: "select",
      options: courses.map((c) => ({ label: c.courseName, value: c.courseId })),
    },
    {
      name: "entityId",
      label: "Entity",
      type: "select",
      options: entityOptions.map((e) => ({
        label: e.entityName,
        value: e.entityId,
      })),
      required: true,
      onLoadMore: () => fetchEntities(),
      isLoadingMore: loadingEntities,
    },
    { name: "introduceDate", label: "Introduce Date", type: "Date" },
    { name: "suspendedDate", label: "Suspended Date", type: "Date" },
    {
      name: "membershipId",
      label: "Membership",
      type: "select",
      options: membershipOptions.map((m) => ({
        label: `${m.startDate} to ${m.endDate}`,
        value: m.membershipId,
      })),
      required: true,
      onLoadMore: () => fetchMemberships(),
      isLoadingMore: loadingMemberships,
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
    { name: "startTime", label: "Start Time", type: "time", required: true },
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
    { name: "admissionCriteria", label: "Admission Criteria", type: "text" },
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
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
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
              loading={false}
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
