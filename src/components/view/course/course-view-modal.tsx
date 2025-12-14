import { useCallback } from "react";
import { Hash, BookOpen, Clock, CheckCircle, Info } from "lucide-react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { Course } from "@/types/course";
import { getCourseById } from "@/api/course.api";
import type { FieldConfig } from "@/components/view-modal/types";
import type { Response } from "@/types/response";

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
      nums = compact
        .split("")
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n));
    }
  }

  const labels = nums
    .map((n) => {
      if (n >= 1 && n <= 7) return WEEKDAY_NAMES[n - 1];
      return null;
    })
    .filter(Boolean) as string[];

  return labels.length > 0 ? labels.join(", ") : "-";
}

const fields: FieldConfig<Course>[] = [
  { key: "courseId", label: "Course ID", icon: Hash },
  { key: "courseName", label: "Course Name", icon: BookOpen },
  { key: "academyName", label: "Academy Name", icon: BookOpen },
  { key: "activityName", label: "Activity Name", icon: BookOpen },

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

      const res: Response<Course> = await getCourseById(Number(useId));
      return res.data as Course;
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
