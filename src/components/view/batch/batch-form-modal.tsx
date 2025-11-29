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
  const isEdit = Boolean(initialData && initialData.batchId);

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
      console.log("instance of date");
      return dfFormat(t, "HH:mm");
    }
    const maybeDate = new Date(t);
    if (!Number.isNaN(maybeDate.getTime())) {
      console.log(maybeDate, "{+", dfFormat(maybeDate, "HH:mm"), "last valu");
      return dfFormat(maybeDate, "HH:mm");
    }
    return undefined;
  };

  const timeToMinutes = (t: any): number | null => {
    const hhmm = normalizeTimeToHHmm(t);
    if (!hhmm) return null;
    const [hh, mm] = hhmm.split(":").map((n) => Number(n));
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    return hh * 60 + mm;
  };
  // safe format helpers (handle strings, Date or undefined)
  const formatDateInput = (d: any): string | undefined => {
    if (d === undefined || d === null) return undefined;
    const dt = typeof d === "string" ? new Date(d) : d;
    if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) return undefined;
    return dfFormat(dt, "yyyy-MM-dd");
  };

  const formatTimeInput = (t: any): string | undefined => {
    if (t === undefined || t === null) return undefined;
    // if already "HH:mm" string, normalizeTimeToHHmm will handle; reuse it
    return normalizeTimeToHHmm(t);
  };

  // NOTE: weekDays will be stored as array of weekday strings, e.g. ['monday','wednesday']
  const empty: Partial<Batch> = {
    batchName: initialData?.batchName ?? "",
    academyId: initialData?.academyId ?? undefined,
    courseId: initialData?.courseId ?? undefined,
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

  const [values, setValues] = useState<Partial<Batch>>(empty);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [academies, setAcademies] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [courses, setCourses] = useState<Array<{ id: number; name: string }>>(
    []
  );
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

  // reset values when initialData changes or modal opens/closes
  // reset values when initialData changes or modal opens/closes
  useEffect(() => {
    const mapped = {
      ...empty,
      // preserve other incoming fields if present but normalize date/time/weekDays
      ...(initialData && {
        batchName: initialData.batchName ?? empty.batchName,
        academyId: initialData.academyId ?? empty.academyId,
        courseId: initialData.courseId ?? empty.courseId,
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

    setValues(mapped);
    setFieldErrors({});
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isOpen]);

  // load academies + facilities on open. Courses/coaches and areas are loaded filtered when an academy/facility is selected.
  useEffect(() => {
    if (!isOpen) return;

    const loadTopOptions = async () => {
      setLoadingOptions(true);
      try {
        const [academiesData, facilitiesData] = await Promise.all([
          getAcademies(),
          getFacilities(),
        ]);

        // academies
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const academyArr = Array.isArray(
          (academiesData as any)?.data ?? academiesData
        )
          ? (academiesData as any)?.data ?? academiesData
          : [];
        setAcademies(
          academyArr.map((a: any) => ({ id: a.academyId, name: a.academyName }))
        );

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

        // if initialData has academyId or facilityId, load filtered lists
        if (initialData?.academyId) {
          await loadCoursesAndCoaches(initialData.academyId);
        }
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

  // helper: load courses and coaches filtered by academyId (academyId optional)
  const loadCoursesAndCoaches = useCallback(
    async (academyId?: number | string) => {
      try {
        const id = academyId ? Number(academyId) : undefined;
        // assume getCourses and getAcademyCoaches accept an optional academyId param; if not, adapt accordingly
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

        setCourses(
          coursesArr.map((c: any) => ({ id: c.courseId, name: c.courseName }))
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
        // assume getAreas can accept facilityId filter, otherwise it will return all areas
        const areasData = await getAreas({ facilityId: id });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const areasArr = Array.isArray((areasData as any)?.data ?? areasData)
          ? (areasData as any)?.data ?? areasData
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

  // generic onChange: additional side-effects for selected academy & facility & weekDays multi-select
  const onChange = (field: keyof Batch, val: any) => {
    // handle academy selection: reset course+coach, load filtered lists
    if (field === "academyId") {
      const academyId = val ? Number(val) : undefined;
      setValues((p) => ({
        ...p,
        academyId: academyId,
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

    // handle facility selection: reset area, load areas for facility
    if (field === "facilityId") {
      const facilityId = val ? Number(val) : undefined;
      setValues((p) => ({ ...p, facilityId: facilityId, areaId: undefined }));
      loadAreasByFacility(facilityId);
      setFieldErrors((prev) => {
        if (!prev.facilityId) return prev;
        const copy = { ...prev };
        delete copy.facilityId;
        return copy;
      });
      return;
    }

    // courseId or coachId simple change
    if (field === "courseId" || field === "coachId" || field === "areaId") {
      setValues((p) => ({ ...p, [field]: val }));
      setFieldErrors((prev) => {
        if (!prev[field as string]) return prev;
        const copy = { ...prev };
        delete copy[field as string];
        return copy;
      });
      return;
    }

    // weekDays multi-select: set array of weekday strings
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

    // default behavior (including time fields which can be string "HH:mm" or Date)
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
    if (!values.academyId) {
      errs.academyId = "Academy is required";
    }
    if (!values.courseId) {
      errs.courseId = "Course is required";
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
        courseId: Number(values.courseId),
        coachId: Number(values.coachId),
        facilityId: Number(values.facilityId),
        areaId: Number(values.areaId),
        introduceDate: values.introduceDate
          ? new Date(values.introduceDate as any)
          : new Date(),
        suspendedDate: values.suspendedDate
          ? new Date(values.suspendedDate as any)
          : undefined,
        // send times as "HH:mm" strings
        startTime: normalizedStart,
        endTime: normalizedEnd,
        // send weekDays as numeric code (e.g. 12, 134) OR undefined if none
        weekDays: weekCode,
        status: values.status ?? "active",
      };
      let res: ResResponse;
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
      name: "academyId",
      label: "Academy",
      type: "select",
      required: true,
      options: academies.map((a) => ({ label: a.name, value: String(a.id) })),
      disabled: loadingOptions,
    },
    {
      name: "courseId",
      label: "Course",
      type: "select",
      required: true,
      options: courses.map((c) => ({ label: c.name, value: String(c.id) })),
      disabled: loadingOptions,
    },
    {
      name: "coachId",
      label: "Coach",
      type: "select",
      required: true,
      options: coaches.map((c) => ({ label: c.name, value: String(c.id) })),
      disabled: loadingOptions,
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
      disabled: loadingOptions,
    },
    {
      name: "weekDays",
      label: "Week Days",
      type: "multiselect", // expects FormContent to support multiselect arrays
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
