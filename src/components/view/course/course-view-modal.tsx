import { useCallback } from "react";
import { Hash, BookOpen, Clock, Info, CheckCircle } from "lucide-react";
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

const fields: FieldConfig<Course>[] = [
  { key: "courseId", label: "Course ID", icon: Hash },
  { key: "courseName", label: "Course Name", icon: BookOpen },
  { key: "activityName", label: "Activity", icon: BookOpen },
  { key: "courseType", label: "Course Type", icon: Info },
  { key: "classification", label: "Classification", icon: Info },

  {
    key: "introduceDate",
    label: "Introduce Date",
    icon: Clock,
    render: (v) => new Date(v as any).toLocaleDateString(),
  },
  {
    key: "suspensionDate",
    label: "Suspension Date",
    icon: Clock,
    render: (v) => (v ? new Date(v as any).toLocaleDateString() : "-"),
  },

  { key: "sessionMinutes", label: "Session Minutes", icon: Clock },
  { key: "noOfDaysInWeek", label: "Days / Week", icon: Hash },
  { key: "batchCapacity", label: "Batch Capacity", icon: Hash },
  { key: "minEnrollmentUnits", label: "Min Enrollment Units", icon: Hash },

  { key: "minAge", label: "Min Age", icon: Hash },
  { key: "maxAge", label: "Max Age", icon: Hash },
  { key: "gender", label: "Gender", icon: Info },

  {
    key: "changable",
    label: "Changable",
    icon: CheckCircle,
    render: (v) => (v ? "Yes" : "No"),
  },

  { key: "freezingAllowed", label: "Freezing Allowed", icon: Hash },

  {
    key: "createdAt",
    label: "Created At",
    icon: Clock,
    render: (v) => new Date(v as any).toLocaleString(),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Clock,
    render: (v) => new Date(v as any).toLocaleString(),
  },
];

export default function CourseViewModal({ isOpen, courseId, onClose }: Props) {
  const fetchFn = useCallback(async (): Promise<Course> => {
    const res: Response<Course> = await getCourseById(Number(courseId));
    return res.data as Course;
  }, [courseId]);

  return (
    <ViewModal<Course>
      isOpen={isOpen}
      onClose={onClose}
      itemId={courseId}
      fetchFn={fetchFn}
      fields={fields}
      title="Course Details"
      layout="grid"
    />
  );
}
