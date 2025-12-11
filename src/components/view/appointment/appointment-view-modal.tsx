"use client";

import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { Appointment } from "@/types/appointment";
import { getAppointmentById } from "@/api/appointment.api";
import { Tag, Users, Layers, Calendar } from "lucide-react";
import type { FieldConfig } from "@/components/view-modal/types";

type Props = {
  isOpen: boolean;
  appointmentId?: number;
  onClose: () => void;
};

const fields: FieldConfig<Appointment>[] = [
  { key: "appointmentId", label: "ID", icon: Tag },
  { key: "enrollmentName", label: "Enrollment", icon: Users },
  { key: "enrollmentId", label: "Enrollment ID", icon: Users },
  { key: "noOfPerson", label: "No. of Persons", icon: Users },
  { key: "batchName", label: "Batch", icon: Layers },
  { key: "batchId", label: "Batch ID", icon: Layers },
  {
    key: "createdAt",
    label: "Created At",
    icon: Calendar,
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Calendar,
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },
];

export default function AppointmentViewModal({
  isOpen,
  appointmentId,
  onClose,
}: Props) {
  const fetchFn = useCallback(
    async (id?: number | string) => {
      const useId = id ?? appointmentId;
      if (!useId) throw new Error("ID missing");
      const res = await getAppointmentById(Number(useId));
      if (res && res.data) return res.data;
      return res;
    },
    [appointmentId]
  );

  return (
    <ViewModal<Appointment>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(appointmentId)}
      fetchFn={fetchFn}
      fields={fields}
      title="View Appointment"
      layout="grid"
    />
  );
}
