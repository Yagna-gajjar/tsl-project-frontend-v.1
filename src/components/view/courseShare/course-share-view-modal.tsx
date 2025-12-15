import { useCallback } from "react";
import { Hash, Info, Percent, Clock, Building2 } from "lucide-react";
import { ViewModal } from "@/components/view-modal/view-modal";

import { getCourseShareById } from "@/api/courseShare.api";
import type { CourseShare } from "@/types/courseShare";
import type { FieldConfig } from "@/components/view-modal/types";
import type { Response } from "@/types/response";

type Props = {
  isOpen: boolean;
  courseShareId?: number;
  onClose: () => void;
};

const fields: FieldConfig<CourseShare>[] = [
  { key: "courseShareId", label: "Share ID", icon: Hash },
  { key: "academyName", label: "Academy", icon: Building2 },
  { key: "shareType", label: "Share Type", icon: Info },
  {
    key: "share",
    label: "Share (%)",
    icon: Percent,
    render: (v) => `${v}%`,
  },
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

export default function CourseShareViewModal({
  isOpen,
  courseShareId,
  onClose,
}: Props) {
  const fetchFn = useCallback(async (): Promise<CourseShare> => {
    const res: Response<CourseShare> = await getCourseShareById(
      Number(courseShareId)
    );
    return res.data as CourseShare;
  }, [courseShareId]);

  return (
    <ViewModal<CourseShare>
      isOpen={isOpen}
      onClose={onClose}
      itemId={courseShareId}
      fetchFn={fetchFn}
      fields={fields}
      title="Course Share Details"
      layout="grid"
    />
  );
}
