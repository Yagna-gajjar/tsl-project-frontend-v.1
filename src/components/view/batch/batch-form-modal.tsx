import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import { createBatch, editBatch } from "@/api/batch.api";
import { getCourses } from "@/api/course.api";
import { getAcademyCoaches } from "@/api/academyCoach.api";
import { getFacilities } from "@/api/facility.api";
import { getAreas } from "@/api/area.api";
import { getAcademies } from "@/api/academy.api";
import type { Batch } from "@/types/batch";
import { toast } from "@/hooks/use-toast";
import { format as dfFormat } from "date-fns";
import { getEnumsByCategory } from "@/api/enums.api";
import type { Response } from "@/types/response";

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
  // helper: convert incoming week code (e.g. 12 or "134") to array ["monday","tuesday"] etc.
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

  // helper: convert array of weekday keys to a numeric code like 12, 134 etc.
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

  // Accepts string "HH:mm" or Date -> returns "HH:mm" or undefined
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

  // Add minutes to a time and return "HH:mm"
  const addMinutesToTime = (
    t: any,
    minutesToAdd: number
  ): string | undefined => {
    const base = timeToMinutes(t);
    if (base === null || !Number.isFinite(minutesToAdd)) return undefined;
    let total = base + minutesToAdd;
    const dayMinutes = 24 * 60;
    total = ((total % dayMinutes) + dayMinutes) % dayMinutes; // wrap around day
    const hh = Math.floor(total / 60);
    const mm = total % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  // safe format helpers (handle strings, Date or undefined)
  const formatTimeInput = (t: any): string | undefined => {
    if (t === undefined || t === null) return undefined;
    // if already "HH:mm" string, normalizeTimeToHHmm will handle; reuse it
    return normalizeTimeToHHmm(t);
  };

  // Activity options (shape: { label, value }) to feed FormContent select
  const [activityOptions, setActivityOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);

  const getAllActivity = async () => {
    try {
      const response: Response = await getEnumsByCategory("activity");
      const items = response?.data || [];

      const mapped = (items as any[]).map((it: any) => {
        const rawValue =
          it?.id !== undefined ? Number(it.id) : String(it?.value ?? "");
        const label = it?.value && String(it.value);
        return { label, value: rawValue };
      });
      setActivityOptions(mapped);
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
    activityName: initialData?.activityName ?? undefined,
    coachId: initialData?.coachId ?? undefined,
    facilityId: initialData?.facilityId ?? undefined,
    areaId: initialData?.areaId ?? undefined,
    // format dates as "yyyy-MM-dd" strings for date inputs
    introduceDate: formatDateInput(initialData?.introduceDate) ?? undefined,
    suspendedDate: formatDateInput(initialData?.suspendedDate) ?? undefined,
    // format times as "HH:mm" for time inputs
    startTime: formatTimeInput(initialData?.startTime) ?? undefined,
    endTime: formatTimeInput(initialData?.endTime) ?? undefined,
    // convert numeric code -> array for multiselect
    weekDays: numberToWeekArray(initialData?.weekDays as any) ?? [],
    status: (initialData?.status ?? "active") as "active" | "suspended",
  };

  const isEdit = Boolean(initialData && initialData.batchId);
  const [values, setValues] = useState<Partial<Batch>>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // ⬇ changed type to also keep sessionMinutes & weekDays from course
  const [academies, setAcademies] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [courses, setCourses] = useState<
    Array<{
      id: number;
      name: string;
      sessionMinutes?: number;
      weekDays?: number | string | null;
    }>
  >([]);
  const [coaches, setCoaches] = useState<Array<{ id: number; name: string }>>(
    []
  );
  const [facilities, setFacilities] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [areas, setAreas] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Weekday options for multi-select
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

  // load activities + facilities on open (academies will be fetched only when activityName is selected)
  useEffect(() => {
    if (!isOpen) return;

    const loadTopOptions = async () => {
      setLoadingOptions(true);
      try {
        // Fetch facilities and activities now
        const [facilitiesData] = await Promise.all([getFacilities()]);

        // facilities
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const facArr = Array.isArray(
          (facilitiesData as any)?.data ?? facilitiesData
        )
          ? (facilitiesData as any)?.data ?? facilitiesData
          : [];
        setFacilities(
          facArr.map((f: any) => ({ id: f.facilityId, name: f.facilityName }))
        );

        // fetch activities for the activity select
        await getAllActivity();

        // if editing and there's an activity present, load academies for that activity so academy field shows options
        if (initialData?.activityName) {
          await loadAcademiesByActivity(String(initialData.activityName));
        }

        // if initialData has facilityId, load areas
        if (initialData?.facilityId) {
          await loadAreasByFacility(initialData.facilityId);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // helper: load academies filtered by selected activityName
  const loadAcademiesByActivity = useCallback(async (activityName?: string) => {
    try {
      // small UX: show loading while fetching academies
      setLoadingOptions(true);
      const academiesData = await getAcademies({
        academyType: activityName,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // helper: load courses and coaches filtered by academyId (academyId optional)
  const loadCoursesAndCoaches = useCallback(
    async (academyId?: number | string) => {
      try {
        const id = academyId ? Number(academyId) : undefined;
        const [coursesData, coachesData] = await Promise.all([
          getCourses({ academyId: id }),
          getAcademyCoaches({ academyId: id }),
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const coursesArr = Array.isArray(
          (coursesData as any)?.data ?? coursesData
        )
          ? (coursesData as any)?.data ?? coursesData
          : [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const coachesArr = Array.isArray(
          (coachesData as any)?.data ?? coachesData
        )
          ? (coachesData as any)?.data ?? coachesData
          : Array.isArray(coachesData)
          ? coachesData
          : [];

        // ⬇ keep extra data from course: sessionMinutes & weekDays
        setCourses(
          coursesArr.map((c: any) => ({
            id: c.courseId,
            name: c.courseName,
            sessionMinutes: c.sessionMinutes,
            weekDays: c.weekDays,
          }))
        );
        setCoaches(
          coachesArr.map((c: any) => ({
            id: c.coachId,
            name: `${c.coachFirstName || ""} ${c.coachLastName || ""}`,
          }))
        );
      } catch (err) {
        console.error("Failed to load courses/coaches:", err);
        setCourses([]);
        setCoaches([]);
        toast({
          title: "Error",
          description: "Failed to load courses or coaches",
          variant: "destructive",
        });
      }
    },
    []
  );

  // helper: load areas filtered by facilityId
  const loadAreasByFacility = useCallback(
    async (facilityId?: number | string) => {
      try {
        const id = facilityId ? Number(facilityId) : undefined;
        const areasData = await getAreas({ facilityId: id });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const areasArr = Array.isArray((areasData as any)?.data ?? areasData)
          ? (areasData as any).data ?? areasData
          : [];
        setAreas(
          areasArr.map((a: any) => ({ id: a.areaId, name: a.areaName }))
        );
      } catch (err) {
        console.error("Failed to load areas by facility:", err);
        setAreas([]);
        toast({
          title: "Error",
          description: "Failed to load areas",
          variant: "destructive",
        });
      }
    },
    []
  );

  // reset values when initialData changes or modal opens/closes
  useEffect(() => {
    const mapped = {
      ...empty,
      ...(initialData && {
        batchName: initialData.batchName ?? empty.batchName,
        academyId: initialData.academyId ?? empty.academyId,
        courseId: initialData.courseId ?? empty.courseId,
        activityName: initialData.activityName ?? empty.activityName,
        coachId: initialData.coachId ?? empty.coachId,
        facilityId: initialData.facilityId ?? empty.facilityId,
        areaId: initialData.areaId ?? empty.areaId,
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

    getAllActivity();
    setValues(mapped);
    setFieldErrors({});
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isOpen]);

  // generic onChange: activityName, academy, course, facility, weekDays etc.
  const onChange = (field: keyof Batch, val: any) => {
    // activity selection
    if (field === "activityName") {
      const activityName = val ? String(val) : undefined;
      setValues((p) => ({
        ...p,
        activityName,
        academyId: undefined,
        courseId: undefined,
        coachId: undefined,
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

    // academy selection
    if (field === "academyId") {
      const academyId = val ? Number(val) : undefined;
      setValues((p) => ({
        ...p,
        academyId,
        courseId: undefined,
        coachId: undefined,
      }));
      loadCoursesAndCoaches(academyId);
      setFieldErrors((prev) => {
        if (!prev.academyId) return prev;
        const copy = { ...prev };
        delete copy.academyId;
        return copy;
      });
      return;
    }

    // course selection (OPTIONAL but with side-effects)
    if (field === "courseId") {
      const courseIdVal = val ? Number(val) : undefined;
      const selectedCourse = courseIdVal
        ? courses.find((c) => Number(c.id) === Number(courseIdVal))
        : undefined;

      setValues((prev) => {
        // auto-fill weekDays from course.weekDays if available
        let nextWeekDays = prev.weekDays;
        if (selectedCourse && selectedCourse.weekDays != null) {
          const auto = numberToWeekArray(selectedCourse.weekDays as any);
          if (auto.length > 0) {
            nextWeekDays = auto;
          }
        }

        // if we already have startTime and course has sessionMinutes -> compute endTime
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

        return {
          ...prev,
          courseId: courseIdVal,
          weekDays: nextWeekDays,
          endTime: nextEndTime,
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

    // facility selection
    if (field === "facilityId") {
      const facilityId = val ? Number(val) : undefined;
      setValues((p) => ({ ...p, facilityId, areaId: undefined }));
      loadAreasByFacility(facilityId);
      setFieldErrors((prev) => {
        if (!prev.facilityId) return prev;
        const copy = { ...prev };
        delete copy.facilityId;
        return copy;
      });
      return;
    }

    // area / coach simple changes
    if (field === "coachId" || field === "areaId") {
      setValues((p) => ({ ...p, [field]: val }));
      setFieldErrors((prev) => {
        if (!prev[field as string]) return prev;
        const copy = { ...prev };
        delete copy[field as string];
        return copy;
      });
      return;
    }

    // weekDays multi-select
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

    // special handling for startTime when course is selected
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

    // default behavior (including endTime when no course is selected)
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
    // courseId is OPTIONAL now → no error
    if (!values.academyId) {
      errs.academyId = "Academy is required";
    }
    if (!values.coachId) {
      errs.coachId = "Coach is required";
    }
    if (!values.facilityId) {
      errs.facilityId = "Facility is required";
    }
    if (!values.areaId) {
      errs.areaId = "Area is required";
    }

    // startTime / endTime required
    if (!values.startTime) {
      errs.startTime = "Start time is required";
    }
    if (!values.endTime) {
      errs.endTime = "End time is required";
    }

    // weekDays must be an array with at least one selected
    if (
      !values.weekDays ||
      !Array.isArray(values.weekDays) ||
      values.weekDays.length < 1
    ) {
      errs.weekDays = "Select at least one weekday";
    }

    // time relationship validations (compare minutes)
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
    } catch {
      // ignore parse errors here; generic checks above will catch missing times
    }

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
    } catch {
      // ignore parse errors
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
      // normalize times to "HH:mm" string before sending
      const normalizedStart = normalizeTimeToHHmm(values.startTime);
      const normalizedEnd = normalizeTimeToHHmm(values.endTime);

      // convert weekDays array to numeric code
      const weekCode = weekArrayToNumber(values.weekDays as any[]);

      const payload: Partial<Batch> = {
        batchName: String(values.batchName ?? "").trim(),
        academyId: Number(values.academyId),
        // courseId is OPTIONAL now
        courseId: values.courseId ? Number(values.courseId) : undefined,
        coachId: Number(values.coachId),
        facilityId: Number(values.facilityId),
        areaId: Number(values.areaId),
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
      name: "activityName",
      label: "Activity",
      type: "select",
      options: activityOptions.map((a) => ({ label: a.label, value: a.label })),
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
      required: false, // ⬅ optional now
      options: courses.map((c) => ({ label: c.name, value: String(c.id) })),
      disabled: loadingOptions || !values.academyId,
    },
    {
      name: "coachId",
      label: "Coach",
      type: "select",
      required: true,
      options: coaches.map((c) => ({ label: c.name, value: String(c.id) })),
      disabled: loadingOptions || !values.academyId,
    },
    {
      name: "facilityId",
      label: "Facility",
      type: "select",
      required: true,
      options: facilities.map((f) => ({ label: f.name, value: String(f.id) })),
      disabled: loadingOptions,
    },
    {
      name: "areaId",
      label: "Area",
      type: "select",
      required: true,
      options: areas.map((a) => ({ label: a.name, value: String(a.id) })),
      disabled: loadingOptions || !values.facilityId,
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
      // ⬇ when course selected, endTime is controlled by sessionMinutes
      disabled: !!values.courseId,
    },
    {
      name: "introduceDate",
      label: "Introduce Date",
      type: "date",
    },
    {
      name: "suspendedDate",
      label: "Suspended Date",
      type: "date",
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
