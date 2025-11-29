import { useCallback } from "react";
import { Hash, BookOpen, Clock, CheckCircle, Info } from "lucide-react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { Course } from "@/types/course";
import { getCourseById } from "@/api/course.api";
import type { FieldConfig } from "@/components/view-modal/types";

type Props = {
  isOpen: boolean;
  courseId?: number;
  onClose: () => void;
};

const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function renderWeekdays(value: any) {
  // Accepts:
  // - compact string: "135"
  // - number: 135
  // - array: [1,3,5]
  // - comma separated string: "1,3,5"
  // Normalizes to readable names: "Monday, Wednesday, Friday"
  if (value == null || value === "") return "-";

  let nums: number[] = [];

  if (Array.isArray(value)) {
    nums = value.map((v) => Number(v)).filter((n) => Number.isFinite(n));
  } else if (typeof value === "number") {
    nums = String(value)
      .split("")
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n));
  } else if (typeof value === "string") {
    const compact = value.trim();
    if (compact.includes(",")) {
      nums = compact
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n));
    } else {
      // treat every character as a digit (e.g. "135")
      nums = compact
        .split("")
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n));
    }
  }

  // convert 1..7 -> Monday..Sunday; if backend uses 0..6 or different, adjust here
  const labels = nums
    .map((n) => {
      // ensure in 1..7
      if (n >= 1 && n <= 7) return WEEKDAY_NAMES[n - 1];
      return null;
    })
    .filter(Boolean) as string[];

  return labels.length > 0 ? labels.join(", ") : "-";
}

const fields: FieldConfig<Course>[] = [
  { key: "courseId", label: "Course ID", icon: Hash },
  { key: "courseName", label: "Course Name", icon: BookOpen },
  // Academy / Activity (IDs and optional names)
  { key: "academyName", label: "Academy Name", icon: BookOpen },
  { key: "activityName", label: "Activity Name", icon: BookOpen },

  // Dates
  {
    key: "introductionDate",
    label: "Introduction Date",
    icon: Clock,
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    key: "suspendDate",
    label: "Suspend Date",
    icon: Clock,
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },

  // Course specifics
  { key: "typeOfCourse", label: "Type Of Course", icon: Info },
  { key: "minEnrollmentUnit", label: "Min Enrollment Unit", icon: Hash },
  { key: "totalParallelBatches", label: "Total Parallel Batches", icon: Hash },

  {
    key: "classificationType",
    label: "Classification Type",
    icon: Info,
  },
  {
    key: "chargingPattern",
    label: "Charging Pattern",
    icon: Info,
  },
  { key: "sessionMinutes", label: "Session Minutes", icon: Clock },
  { key: "noOfDaysInWeek", label: "No Of Days In Week", icon: Hash },

  // Week days: show human readable names (converts compact string like "135" -> Monday, Wednesday, Friday)
  {
    key: "weekDays",
    label: "Week Days",
    icon: BookOpen,
    render: (v) => renderWeekdays(v),
  },

  { key: "unitRate", label: "Unit Rate", icon: Hash },
  { key: "batchCapacity", label: "Batch Capacity", icon: Hash },

  { key: "minAge", label: "Minimum Age", icon: Hash },
  { key: "maxAge", label: "Maximum Age", icon: Hash },

  {
    key: "gender",
    label: "Gender",
    icon: Info,
  },

  {
    key: "status",
    label: "Status",
    icon: CheckCircle,
    render: (v) => {
      const statusColor =
        v === "active"
          ? "text-green-600"
          : v === "suspended"
          ? "text-yellow-600"
          : "text-red-600";
      return <span className={statusColor}>{v || "-"}</span>;
    },
  },

  // Timestamps if present
  {
    key: "createdAt",
    label: "Created At",
    icon: Clock,
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Clock,
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },
];

export default function CourseViewModal({ isOpen, courseId, onClose }: Props) {
  const fetchFn = useCallback(
    async (id?: number | string): Promise<Course> => {
      const useId = id ?? courseId;
      if (!useId) throw new Error("Course ID missing");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await getCourseById(Number(useId));

      // normalize: API may return { success, data } or raw course
      if (res && res.data) return res.data as Course;

      return res as Course;
    },
    [courseId]
  );

  return (
    <ViewModal<Course>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(courseId)}
      fetchFn={fetchFn}
      fields={fields}
      title="Course Details"
      layout="grid"
    />
  );
}
