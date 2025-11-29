import { useCallback } from "react";
import {
  Hash,
  Calendar,
  BarChart3,
  CheckCircle,
} from "lucide-react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { Discount } from "@/types/discount";
import { getDiscountById } from "@/api/discount.api";
import type { FieldConfig } from "@/components/view-modal/types";

type Props = {
  isOpen: boolean;
  discountId?: number;
  onClose: () => void;
};

const fields: FieldConfig<Discount>[] = [
  { key: "discountId", label: "Discount ID", icon: Hash },
  { key: "courseId", label: "Course ID", icon: Hash },
  { key: "courseName", label: "Course Name", icon: BarChart3 },
  { key: "aboveUnits", label: "Above Units", icon: Hash },
  {
    key: "discountPercentage",
    label: "Discount Percentage",
    icon: BarChart3,
    render: (v) => {
      const percentage = v as number;
      return `${Number(percentage)?.toFixed(2) || "0.00"}%`;
    },
  },
  {
    key: "introduceDate",
    label: "Introduce Date",
    icon: Calendar,
    render: (v) => (v ? new Date(v as Date).toLocaleDateString() : "-"),
  },
  {
    key: "suspendDate",
    label: "Suspend Date",
    icon: Calendar,
    render: (v) => {
      return v ? new Date(v as Date).toLocaleDateString() : "-";
    },
  },
  {
    key: "status",
    label: "Status",
    icon: CheckCircle,
    render: (v) => {
      const statusColor = v.toLowerCase() === "active" ? "text-green-600" : "text-red-600";
      return <span className={statusColor}>{v || "unknown"}</span>;
    },
  },
  {
    key: "createdAt",
    label: "Created At",
    icon: Calendar,
    render: (v) => (v ? new Date(v as Date).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Calendar,
    render: (v) => (v ? new Date(v as Date).toLocaleString() : "-"),
  },
];

export default function DiscountViewModal({
  isOpen,
  discountId,
  onClose,
}: Props) {
  const fetchFn = useCallback(
    async (id?: number | string): Promise<Discount> => {
      const useId = id ?? discountId;
      if (!useId) throw new Error("Discount ID missing");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await getDiscountById(Number(useId));

      // normalize: API may return { success, data } or raw discount
      if (res && res.data) return res.data as Discount;

      return res as Discount;
    },
    [discountId]
  );

  return (
    <ViewModal<Discount>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(discountId)}
      fetchFn={fetchFn}
      fields={fields}
      title="Discount Details"
      layout="grid"
    />
  );
}
