import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { Academy } from "@/types/academy";
import { getAcademyById } from "@/api/academy.api";
import { formatDateForInput } from "@/lib/utils";

import {
  Building2,
  Tag,
  Mail,
  Phone,
  Instagram,
  Facebook,
  Youtube,
  FileText,
  PieChart,
  CreditCard,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
import type { FieldConfig } from "@/components/view-modal/types";
import type { Response } from "@/types/response";

type Props = {
  isOpen: boolean;
  academyId?: number;
  onClose: () => void;
};

const fields: FieldConfig<Academy>[] = [
  { key: "academyId", label: "Academy ID", icon: Tag },
  { key: "academyName", label: "Academy Name", icon: Building2 },
  { key: "academyType", label: "Academy Type", icon: Tag },
  { key: "email", label: "Email", icon: Mail },
  { key: "contactNumber", label: "Contact Number", icon: Phone },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "about", label: "About", icon: FileText },
  { key: "share_main", label: "Main Share %", icon: PieChart },
  { key: "share_tanna", label: "Tanna Share %", icon: PieChart },
  { key: "share_tsl", label: "TSL Share %", icon: PieChart },
  { key: "share_expenses", label: "Expenses Share %", icon: PieChart },
  { key: "panCard", label: "PAN Card", icon: CreditCard },
  {
    key: "registrationDate",
    label: "Registration Date",
    icon: Calendar,
    render: (v) => (v ? formatDateForInput(v as string) : "-"),
  },
  {
    key: "discontinuedDate",
    label: "Discontinued Date",
    icon: Calendar,
    render: (v) => (v ? formatDateForInput(v as string) : "-"),
  },
  { key: "addressId", label: "Address ID", icon: MapPin },
  {
    key: "createdAt",
    label: "Created At",
    icon: Clock,
    render: (v) => (v ? formatDateForInput(v as string) : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Clock,
    render: (v) => (v ? formatDateForInput(v as string) : "-"),
  },
];

export default function AcademyViewModal({
  isOpen,
  academyId,
  onClose,
}: Props) {
  const fetchFn = useCallback(
    async (id?: number | string): Promise<Academy> => {
      const useId = id ?? academyId;
      if (!useId) throw new Error("Academy ID missing");
      const res: Response<Academy> = await getAcademyById(Number(useId));
      const resRow = res?.data ? res?.data : ({} as Academy);
      return resRow;
    },
    [academyId]
  );

  return (
    <ViewModal<Academy>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(academyId)}
      fetchFn={fetchFn}
      fields={fields}
      title="View Academy"
      layout="grid"
    />
  );
}
