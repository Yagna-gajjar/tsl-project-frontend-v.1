import { useCallback } from "react";
import { ViewModal, type FieldConfig } from "@/components/view-modal/view-modal";
import type { Parking } from "@/types/parking";
import {
  User,
  Hash,
  Car,
  Calendar,
  Clock,
  DollarSign,
  FileText,
} from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item?: Parking | null;
};

const fields: FieldConfig<Parking>[] = [
  { key: "parkingId", label: "ID", icon: Hash },
  { key: "memberId", label: "Member", icon: User },
  { key: "vehicleNumber", label: "Vehicle #", icon: Car },
  { key: "vehicleType", label: "Vehicle Type", icon: Car },
  { key: "status", label: "Status", icon: FileText },
  {
    key: "startDate",
    label: "Start Date",
    icon: Calendar,
    render: (v: Parking["startDate"]) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    key: "endDate",
    label: "End Date",
    icon: Calendar,
    render: (v: Parking["endDate"]) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    key: "startTime",
    label: "Start Time",
    icon: Clock,
    render: (v: any) => (v ? new Date(v).toLocaleTimeString() : "-"),
  },
  {
    key: "entTime",
    label: "End Time",
    icon: Clock,
    render: (v: any) => (v ? new Date(v).toLocaleTimeString() : "-"),
  },
  { key: "paymentAmount", label: "Total Amount", icon: DollarSign },
  { key: "paid", label: "Paid", icon: DollarSign },
  { key: "remaining", label: "Remaining", icon: DollarSign },
  { key: "paymentRemarks", label: "Payment Remarks", icon: FileText },
] as any;

export default function ParkingViewModal({ isOpen, onClose, item }: Props) {
  const fetchFn = useCallback(async () => {
    if (!item) throw new Error("No data");
    return item;
  }, [item]);

  return (
    <ViewModal<Parking>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(item?.parkingId)}
      fetchFn={fetchFn}
      fields={fields}
      title="View Parking"
    />
  );
}
