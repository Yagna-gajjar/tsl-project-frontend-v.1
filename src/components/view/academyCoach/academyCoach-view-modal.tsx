import { useCallback } from "react";
import {
  Calendar,
  Fingerprint,
  FileText,
  Hash,
  User,
  Building2,
  Clock,
} from "lucide-react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { AcademyCoach } from "@/types/academyCoach";
import { getAcademyCoachById } from "@/api/academyCoach.api";
import type { FieldConfig } from "@/components/view-modal/types";
import type { Response } from "@/types/response";

type Props = {
  isOpen: boolean;
  academyCoachesId?: number;
  onClose: () => void;
};

const fields: FieldConfig<AcademyCoach>[] = [
  { key: "academyCoachesId", label: "Academy Coach ID", icon: Hash },
  { key: "coachId", label: "Coach ID", icon: User },
  { key: "academyId", label: "Academy ID", icon: Building2 },
  {
    key: "joiningDate",
    label: "Joining Date",
    icon: Calendar,
    render: (v) => (v ? new Date(v).toLocaleDateString() : "-"),
  },
  {
    key: "relievedDate",
    label: "Relieved Date",
    icon: Calendar,
    render: (v) => (v ? new Date(v).toLocaleDateString() : "-"),
  },
  { key: "designation", label: "Designation", icon: FileText },
  { key: "description", label: "Description", icon: FileText },
  { key: "rfid", label: "RFID", icon: Hash },
  { key: "thumbprint", label: "Thumbprint", icon: Fingerprint },
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

export default function AcademyCoachViewModal({
  isOpen,
  academyCoachesId,
  onClose,
}: Props) {
  const fetchFn = useCallback(
    async (id?: number | string): Promise<AcademyCoach> => {
      const useId = id ?? academyCoachesId;
      if (!useId) throw new Error("Academy Coach ID missing");

      const res: Response<AcademyCoach> = await getAcademyCoachById(Number(useId));

      if (res && res.data) return res.data;
    },
    [academyCoachesId]
  );

  return (
    <ViewModal<AcademyCoach>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(academyCoachesId)}
      fetchFn={fetchFn}
      fields={fields}
      title="Academy Coach Details"
      layout="grid"
    />
  );
}
