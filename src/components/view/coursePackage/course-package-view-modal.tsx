import { useCallback } from "react";
import { Hash, BookOpen, Info, Clock } from "lucide-react";
import { ViewModal } from "@/components/view-modal/view-modal";

import { getCoursePackageById } from "@/api/coursePackage.api";
import type { CoursePackage } from "@/types/coursePackage";
import type { FieldConfig } from "@/components/view-modal/types";
import type { Response } from "@/types/response";

type Props = {
  isOpen: boolean;
  coursePackageId?: number;
  onClose: () => void;
};

const fields: FieldConfig<CoursePackage>[] = [
  { key: "coursePackageId", label: "Package ID", icon: Hash },
  { key: "courseName", label: "Course", icon: BookOpen },
  { key: "activityType", label: "Activity Type", icon: Info },
  { key: "linkType", label: "Link Type", icon: Info },
  {
    key: "createdAt",
    label: "Created At",
    icon: Clock,
    render: (v) => new Date(v).toLocaleString(),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Clock,
    render: (v) => new Date(v).toLocaleString(),
  },
];

export default function CoursePackageViewModal({
  isOpen,
  coursePackageId,
  onClose,
}: Props) {
  const fetchFn = useCallback(async (): Promise<CoursePackage> => {
    const res: Response<CoursePackage> = await getCoursePackageById(
      Number(coursePackageId)
    );
    return res.data as CoursePackage;
  }, [coursePackageId]);

  return (
    <ViewModal<CoursePackage>
      isOpen={isOpen}
      onClose={onClose}
      itemId={coursePackageId}
      fetchFn={fetchFn}
      fields={fields}
      title="Course Package Details"
      layout="grid"
    />
  );
}
