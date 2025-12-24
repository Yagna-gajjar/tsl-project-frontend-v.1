import { useCallback } from "react";
import { Hash, BookOpen, Info, Clock, Layers, CheckCircle, ShieldCheck } from "lucide-react";
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
  { key: "courseName", label: "Course Name", icon: BookOpen },
  { key: "batchName", label: "Batch Name", icon: Layers }, // New Field
  { key: "linkType", label: "Link Type", icon: Info },
  {
    key: "status",
    label: "Status",
    icon: CheckCircle,
    render: (v) => (
      <span className="capitalize px-2 py-1 rounded-md bg-gray-100 dark:bg-slate-800 text-sm font-medium">
        {String(v)}
      </span>
    )
  },
  {
    key: "memberFirstName",
    label: "Approval Authority",
    icon: ShieldCheck,
    render: (_, record) => record.memberFirstName
      ? `${record.memberFirstName} ${record.memberLastName || ""}`
      : "Not Assigned"
  },
  {
    key: "createdAt",
    label: "Created At",
    icon: Clock,
    render: (v) => v ? new Date(v as string).toLocaleString() : "N/A",
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Clock,
    render: (v) => v ? new Date(v as string).toLocaleString() : "N/A",
  },
];

export default function CoursePackageViewModal({
  isOpen,
  coursePackageId,
  onClose,
}: Props) {
  const fetchFn = useCallback(async (): Promise<CoursePackage> => {
    if (!coursePackageId) throw new Error("ID is required");

    const res: Response<CoursePackage> = await getCoursePackageById(
      Number(coursePackageId)
    );
    return res.data as CoursePackage;
  }, [coursePackageId]);

  return (
    <ViewModal<CoursePackage>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(coursePackageId)}
      fetchFn={fetchFn}
      fields={fields}
      title="Course Package Information"
      layout="grid"
    />
  );
}