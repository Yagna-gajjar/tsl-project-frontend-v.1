import { useCallback } from "react";
import {
  Hash,
  BookOpen,
  FileText,
  Clock,
  Users,
  Calendar,
  Award,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { Course } from "@/types/course";
import { getCourseById } from "@/api/course.api";
import type { FieldConfig } from "@/components/view-modal/types";

type Props = {
  isOpen: boolean;
  courseId?: number;
  onClose: () => void;
};

const fields: FieldConfig<Course>[] = [
  { key: "courseId", label: "Course ID", icon: Hash },
  { key: "courseName", label: "Course Name", icon: BookOpen },
  {
    key: "status",
    label: "Status",
    icon: CheckCircle,
    render: (v) => {
      const statusColor =
        v === "active"
          ? "text-green-600"
          : v === "inactive"
            ? "text-yellow-600"
            : "text-red-600";
      return <span className={statusColor}>{v || "active"}</span>;
    },
  },
  { key: "academyId", label: "Academy ID", icon: Hash },
  { key: "activityId", label: "Activity ID", icon: Hash },
  { key: "description", label: "Description", icon: FileText },
  { key: "durationType", label: "Duration Type", icon: Clock },
  { key: "durationDays", label: "Duration Days", icon: Calendar },
  { key: "sessionCount", label: "Session Count", icon: Users },
  { key: "daysPerWeek", label: "Days Per Week", icon: Calendar },
  { key: "level", label: "Level", icon: Award },
  { key: "gender", label: "Gender", icon: Users },
  { key: "ageGroup", label: "Age Group", icon: Users },
  {
    key: "fees",
    label: "Fees",
    icon: DollarSign,
    render: (v) => `Rs. ${(v as number)?.toFixed(2) || "0.00"}`,
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

export default function CourseViewModal({
  isOpen,
  courseId,
  onClose,
}: Props) {
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
