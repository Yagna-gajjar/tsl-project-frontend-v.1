import { useCallback } from "react";
import { Hash, BookOpen, Clock, Info, ShieldCheck, MapPin, BadgePercent, CalendarDays } from "lucide-react";
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
  { key: "entityName", label: "Entity Name", icon: MapPin },
  { key: "activityName", label: "Activity", icon: BookOpen },
  { key: "courseType", label: "Course Type", icon: Info },
  { key: "classification", label: "Classification", icon: Info },
  { key: "status", label: "Status", icon: Info },
  {
    key: "introduceDate",
    label: "Introduce Date",
    icon: Clock,
    render: (v) => v ? new Date(v as any).toLocaleDateString() : "-",
  },
  {
    key: "suspensionDate",
    label: "Suspension Date",
    icon: Clock,
    render: (v) => (v ? new Date(v as any).toLocaleDateString() : "-"),
  },
  { key: "chargingPattern", label: "Charging Pattern", icon: Clock },
  { key: "avbFrom", label: "Available From", icon: Clock },
  { key: "avbTo", label: "Available To", icon: Clock },
  { key: "sessionMinutes", label: "Session Duration", icon: Clock, render: (v) => v ? `${v} Mins` : "N/A" },
  { key: "noOfDaysInWeek", label: "Days / Week", icon: CalendarDays },
  { key: "daysPattern", label: "Days Pattern", icon: CalendarDays },
  { key: "batchCapacity", label: "Batch Capacity", icon: Hash },
  { key: "totalParallelBatches", label: "Parallel Batches", icon: Hash },
  { key: "unitsMultipleOf", label: "Units Multiple Of", icon: Hash },
  { key: "maxPerson", label: "Max Persons", icon: Hash, render: (v) => v ?? "Unlimited" },
  { key: "minAge", label: "Min Age", icon: Hash },
  { key: "maxAge", label: "Max Age", icon: Hash },
  {
    key: "gender",
    label: "Gender",
    icon: Info,
    render: (v) => v === 'O' ? "Others/All" : v === 'M' ? "Male" : v === 'F' ? "Female" : v
  },
  {
    key: "enrApprovalRequired",
    label: "Approval Required",
    icon: ShieldCheck,
    render: (v) => v ? "Yes" : "No"
  },
  { key: "cgstRate", label: "CGST Rate (%)", icon: BadgePercent },
  { key: "sgstRate", label: "SGST Rate (%)", icon: BadgePercent },
  {
    key: "balanceUsable",
    label: "Balance Usable",
    icon: Info,
    render: (v) => v === 'F' ? "Full" : v === 'C' ? "Credit Only" : v
  },
  {
    key: "createdAt",
    label: "Created At",
    icon: Clock,
    render: (v) => v ? new Date(v as any).toLocaleString() : "-",
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Clock,
    render: (v) => v ? new Date(v as any).toLocaleString() : "-",
  },
];

export default function CourseViewModal({ isOpen, courseId, onClose }: Props) {
  const fetchFn = useCallback(async (): Promise<Course> => {
    const res: Response<Course> = await getCourseById(Number(courseId));
    if (!res.success || !res.data) throw new Error("Failed to fetch course details");
    return res.data;
  }, [courseId]);

  return (
    <ViewModal<Course>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(courseId)}
      fetchFn={fetchFn}
      fields={fields}
      title="Course Full Details"
      layout="grid"
    />
  );
}