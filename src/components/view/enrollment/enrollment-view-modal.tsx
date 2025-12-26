import { useCallback } from "react";
import {
  Hash,
  Calendar,
  Users,
  BookOpen,
  DollarSign,
  CheckCircle
} from "lucide-react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { Enrollment } from "@/types/enrollment";
import { getEnrollmentById } from "@/api/enrollment.api";
import type { FieldConfig } from "@/components/view-modal/types";
import type { Response } from "@/types/response";

type Props = {
  isOpen: boolean;
  enrollmentId?: number;
  onClose: () => void;
};

const fields: FieldConfig<Enrollment>[] = [
  { key: "enrollmentId", label: "Enrollment ID", icon: Hash },
  // { key: "academyId", label: "Academy ID", icon: Hash },
  // { key: "academyName", label: "Academy Name", icon: BookOpen },
  { key: "courseId", label: "Course ID", icon: BookOpen },
  { key: "courseName", label: "Course Name", icon: BookOpen },
  { key: "memberId", label: "Member ID", icon: Users },
  { key: "memberFirstName", label: "Member First Name", icon: Users },
  { key: "memberLastName", label: "Member Last Name", icon: Users },
  {
    key: "enrollmentDate",
    label: "Enrollment Date",
    icon: Calendar,
    render: (v) => (v ? new Date(v as string).toLocaleDateString() : "-"),
  },
  {
    key: "attendingStartDate",
    label: "Attending Date",
    icon: Calendar,
    render: (v) => (v ? new Date(v as string).toLocaleDateString() : "-"),
  },
  {
    key: "endDate",
    label: "End Date",
    icon: Calendar,
    render: (v) => (v ? new Date(v as string).toLocaleDateString() : "-"),
  },
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
          : "text-blue-600";
      return <span className={statusColor}>{(v as string) || "unknown"}</span>;
    },
  },
  // { key: "sessionUnits", label: "Session Units", icon: Hash },
  // { key: "numberOfDays", label: "Number Of Days", icon: Hash },
  // {
  //   key: "discountedAmount",
  //   label: "Discounted Amount",
  //   icon: DollarSign,
  //   render: (v) => {
  //     const amount = v as number;
  //     return `Rs. ${Number(amount)?.toFixed(2) || "0.00"}`;
  //   },
  // },
  // {
  //   key: "commitedAmount",
  //   label: "Commited Amount",
  //   icon: DollarSign,
  //   render: (v) => {
  //     const amount = v as number;
  //     return `Rs. ${Number(amount)?.toFixed(2) || "0.00"}`;
  //   },
  // },
  {
    key: "billingAmount",
    label: "Billing Amount",
    icon: DollarSign,
    render: (v) => {
      const amount = v as number;
      return `Rs. ${Number(amount)?.toFixed(2) || "0.00"}`;
    },
  },
  {
    key: "billingRate",
    label: "Billing Rate",
    icon: DollarSign,
    render: (v) => {
      const rate = v as number;
      return Number(rate) ? Number(rate).toFixed(2) : "0.00";
    },
  },
  {
    key: "dnOrDiscount",
    label: "CNDN",
    icon: Hash,
    render: (v) => (v === undefined || v === null ? "-" : String(v)),
  },
  // {
  //   key: "adjust",
  //   label: "Adjustment",
  //   icon: Settings2,
  //   render: (v) => (v === undefined || v === null ? "-" : String(v)),
  // },
  {
    key: "openEnrollment",
    label: "Open Enrollment",
    icon: CheckCircle,
    render: (v) => (v ? "Yes" : "No"),
  },
  // { key: "remarks", label: "Remarks", icon: FileText },
  {
    key: "createdAt",
    label: "Created At",
    icon: Calendar,
    render: (v) => (v ? new Date(v as string).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Calendar,
    render: (v) => (v ? new Date(v as string).toLocaleString() : "-"),
  },
];

export default function EnrollmentViewModal({
  isOpen,
  enrollmentId,
  onClose,
}: Props) {
  const fetchFn = useCallback(
    async (id?: number | string): Promise<Enrollment> => {
      const useId = id ?? enrollmentId;
      if (!useId) throw new Error("Enrollment ID missing");

      const res: Response<Enrollment> = await getEnrollmentById(Number(useId));

      if (res && res.data) return res.data as Enrollment;

      return res as Enrollment | any;
    },
    [enrollmentId]
  );

  return (
    <ViewModal<Enrollment>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(enrollmentId)}
      fetchFn={fetchFn}
      fields={fields}
      title="Enrollment Details"
      layout="grid"
    />
  );
}
