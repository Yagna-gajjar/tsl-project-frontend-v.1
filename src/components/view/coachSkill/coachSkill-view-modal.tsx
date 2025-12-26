import { useCallback } from "react";
import {
  Hash,
  User,
  Activity,
  BookOpen,
  Heart,
  Users,
  FileText,
  Clock,
  CheckCircle,
  Info,
} from "lucide-react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { CoachSkill } from "@/types/coachSkill";
import { getCoachSkill } from "@/api/coachSkill.api";
import type { FieldConfig } from "@/components/view-modal/types";
import type { Response } from "@/types/response";

type Props = {
  isOpen: boolean;
  coachSkillId?: number;
  onClose: () => void;
};

const fields: FieldConfig<CoachSkill>[] = [
  { key: "coachSkillId", label: "Skill ID", icon: Hash },
  {
    key: "memberFirstName",
    label: "Member Name",
    icon: User,
    render: (_, row) => `${row.memberFirstName} ${row.memberLastName}`
  },
  { key: "activityName", label: "Activity", icon: Activity },
  { key: "experience", label: "Experience", icon: BookOpen },
  { key: "activityQualification", label: "Qualification", icon: FileText },
  { key: "currentlyInterest", label: "Interest Level", icon: Heart },
  { key: "currentlyInTeam", label: "Current Team", icon: Users },
  {
    key: "status",
    label: "Status",
    icon: Info,
    render: (v) => (
      <span className="capitalize font-medium text-primary">
        {String(v || "N/A")}
      </span>
    )
  },
  {
    key: "wantsUsToManageBookings",
    label: "Manage Bookings",
    icon: CheckCircle,
    render: (v) => (v ? "Yes" : "No"),
  },
  { key: "detailsOfChargesExpected", label: "Charges", icon: FileText },
  { key: "detailsOfServicesAvailable", label: "Services", icon: FileText },
  {
    key: "createdAt",
    label: "Created At",
    icon: Clock,
    render: (v) => (v ? new Date(v as string | Date).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Last Updated",
    icon: Clock,
    render: (v) => (v ? new Date(v as string | Date).toLocaleString() : "-"),
  },
];

export default function CoachSkillViewModal({
  isOpen,
  coachSkillId,
  onClose,
}: Props) {

  const fetchFn = useCallback(
    async (id?: number | string): Promise<CoachSkill> => {
      const targetId = id ?? coachSkillId;
      if (!targetId) {
        throw new Error("Coach Skill ID is missing");
      }

      const res: Response<CoachSkill> = await getCoachSkill(Number(targetId));

      if (res.success && res.data) {
        return res.data;
      }

      throw new Error(res.message || "Failed to load coach skill details");
    },
    [coachSkillId]
  );

  return (
    <ViewModal<CoachSkill>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(coachSkillId)}
      fetchFn={fetchFn}
      fields={fields}
      title="Coach Skill Information"
      layout="grid"
    />
  );
}