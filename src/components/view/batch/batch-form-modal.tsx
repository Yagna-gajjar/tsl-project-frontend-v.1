import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";

import { createBatch, editBatch } from "@/api/batch.api";
import { getCourses } from "@/api/course.api";
import type { Batch } from "@/types/batch";
import { toast } from "@/hooks/use-toast";
import { getActivities } from "@/api/activity.api";
import type { Activity } from "@/types/activity";
import { getEnumsByCategory } from "@/api/enums.api";
import type { Enums } from "@/types/enums";
import { getEntities } from "@/api/entity.api";
import type { Entity } from "@/types/entity";
import type { Course } from "@/types/course";
import { format } from "date-fns";
import { getMembershipMasters } from "@/api/membershipMaster.api";
import type { MembershipMaster } from "@/types/membershipMaster";

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
  // --- Helpers ---
  const numberToWeekArray = (code?: any): string[] => {
    if (!code) return [];
    const s = String(code);
    const map: Record<string, string> = {
      "1": "monday", "2": "tuesday", "3": "wednesday",
      "4": "thursday", "5": "friday", "6": "saturday", "7": "sunday",
    };
    return s.split("").map(ch => map[ch]).filter(Boolean);
  };

  const weekArrayToNumber = (arr?: string[]): number | undefined => {
    if (!arr?.length) return undefined;
    const map: Record<string, number> = {
      monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7,
    };
    const nums = arr.map(k => map[k.toLowerCase()]).filter(n => !!n).sort();
    return Number(nums.join(""));
  };

  const addMinutesToTime = (t: string, mins: number): string | undefined => {
    if (!t || isNaN(mins)) return undefined;
    const [hh, mm] = t.split(":").map(Number);
    let total = hh * 60 + mm + mins;
    const dayMinutes = 1440;
    total = ((total % dayMinutes) + dayMinutes) % dayMinutes;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };

  // --- Options State ---
  const [activityOptions, setActivityOptions] = useState<Activity[]>([]);
  const [membershipOptions, setMembershipOptions] = useState<MembershipMaster[]>([]);
  const [entityOptions, setEntityOptions] = useState<Entity[]>([]);
  const [batchTypeOptions, setBatchTypeOptions] = useState<Enums[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [loading, setLoading] = useState(false);

  const fetchOptions = async () => {
    setLoading(true);
    try {
      const [act, ent, mem, types] = await Promise.all([
        getActivities({ limit: 10000 }),
        getEntities({ limit: 10000 }),
        getMembershipMasters({ limit: 10000 }),
        getEnumsByCategory("BATCHTYPE")
      ]);
      setActivityOptions(act?.data || []);
      setEntityOptions(ent?.data || []);
      setMembershipOptions(mem?.data || []);
      setBatchTypeOptions(types?.data || []);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async (activityId: number) => {
    const res = await getCourses({ activityId });
    setCourses(res?.data || []);
  };

  // --- Form State ---
  const isEdit = Boolean(initialData?.batchId);
  const [values, setValues] = useState<Partial<Batch>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
      if (initialData) {
        console.log(initialData," init");
        setValues({
          ...initialData,
          daysPattern: numberToWeekArray(initialData.daysPattern) as any,
          startTime: initialData.startTime ? String(initialData.startTime).substring(0, 5) : "",
          endTime: initialData.endTime ? String(initialData.endTime).substring(0, 5) : "",
          introduceDate: initialData.introduceDate ? (initialData.introduceDate as string).split("T")[0] : ""
        });
        if (initialData.activityId) loadCourses(Number(initialData.activityId));
      } else {
        setValues({
          status: "active",
          daysPerWeek: 1,
          maxCapacity: 1,
          sessionMinutes: 1,
          introduceDate: format(new Date(), "yyyy-MM-dd")
        });
      }
    }
  }, [isOpen, initialData]);

  const onChange = (field: keyof Batch, val: any) => {
    setValues((prev: any) => {
      const updated = { ...prev, [field]: val };

      // Handle Activity change -> Reset Course
      if (field === "activityId") {
        loadCourses(Number(val));
        updated.courseId = undefined;
      }

      // Handle Course change -> Auto-fill duration and end time
      if (field === "courseId") {
        const course = courses.find(c => Number(c.courseId) === Number(val));
        if (course) {
          updated.sessionMinutes = course.sessionMinutes || prev.sessionMinutes;
          updated.daysPerWeek = course.noOfDaysInWeek || prev.daysPerWeek;
          updated.daysPattern = numberToWeekArray(course.daysPattern);
          updated.maxCapacity = course.batchCapacity || prev.maxCapacity;
          if (prev.startTime) {
            updated.endTime = addMinutesToTime(prev.startTime, updated.sessionMinutes);
          }
        }
      }

      // Handle Duration change -> Update End Time
      if (field === "sessionMinutes" && prev.startTime) {
        updated.endTime = addMinutesToTime(prev.startTime, Number(val));
      }

      // Handle Start Time change -> Update End Time
      if (field === "startTime" && updated.sessionMinutes) {
        updated.endTime = addMinutesToTime(val, Number(updated.sessionMinutes));
      }

      return updated;
    });

    if (fieldErrors[field as string]) {
      const newErrs = { ...fieldErrors };
      delete newErrs[field as string];
      setFieldErrors(newErrs);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        daysPattern: weekArrayToNumber(values.daysPattern as any),
        entityId: Number(values.entityId),
        activityId: Number(values.activityId),
        courseId: values.courseId ? Number(values.courseId) : null,
        membershipMasterId: values.membershipMasterId ? Number(values.membershipMasterId) : null,
      };
      console.log(payload);
      const res = isEdit
        ? await editBatch(Number(values.batchId), payload as Batch)
        : await createBatch(payload as Batch);

      if (res.success) {
        toast({ title: `Batch ${isEdit ? "Updated" : "Created"}` });
        onSaved?.(res?.data as any);
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = [
    { name: "batchName", label: "Batch Name", type: "text", required: true },
    {
      name: "batchType",
      label: "Batch Type",
      type: "select",
      options: batchTypeOptions.map(b => ({ label: String(b.value), value: b.value })),
      required: true
    },
    {
      name: "entityId",
      label: "Entity",
      type: "select",
      options: entityOptions.map(e => ({ label: e.entityName, value: e.entityId })),
      required: true
    },
    {
      name: "activityId",
      label: "Activity",
      type: "select",
      options: activityOptions.map(a => ({ label: a.activityName, value: a.activityId })),
      required: true
    },
    {
      name: "courseId",
      label: "Course (Link)",
      type: "select",
      options: courses.map(c => ({ label: c.courseName, value: c.courseId }))
    },
    {
      name: "membershipMasterId",
      label: "Membership Master",
      type: "select",
      options: membershipOptions.map(m => ({ label: `${m.membershipType}`, value: m.membershipMasterId }))
    },
    { name: "startTime", label: "Start Time", type: "time", required: true },
    { name: "endTime", label: "End Time", type: "time", required: true },
    { name: "sessionMinutes", label: "Session Duration (Mins)", type: "number" },
    { name: "maxCapacity", label: "Max Capacity", type: "number" },
    { name: "daysPerWeek", label: "Days/Week", type: "number" },
    {
      name: "daysPattern",
      label: "Days Pattern",
      type: "multiselect",
      options: [
        { label: "Mon", value: "monday" }, { label: "Tue", value: "tuesday" },
        { label: "Wed", value: "wednesday" }, { label: "Thu", value: "thursday" },
        { label: "Fri", value: "friday" }, { label: "Sat", value: "saturday" },
        { label: "Sun", value: "sunday" }
      ]
    },
    { name: "introduceDate", label: "Introduce Date", type: "Date", required: true },
    { name: "suspendedDate", label: "Suspended Date", type: "Date" },
    { name: "admissionCriteria", label: "Admission Criteria", type: "text" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [{ label: "Active", value: "active" }, { label: "Suspended", value: "suspended" }],
      required: true
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden border-border/50 shadow-2xl">
        <div className="flex flex-col max-h-[90vh]">
          <FormHeader title={isEdit ? "Edit Batch" : "Create New Batch"} onClose={onClose} />
          <div className="flex-1 overflow-y-auto">
            <FormContent
              fields={fields as any}
              values={values}
              errors={fieldErrors}
              error={error}
              isSubmitting={isSubmitting}
              onChange={onChange}
              loading={loading}
              layout={layout}
            />
          </div>
          <FormFooter onClose={onClose} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
      </DialogContent>
    </Dialog>
  );
}