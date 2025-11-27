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
} from "lucide-react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { CoachSkill } from "@/types/coachSkill";
import { getCoachSkillById } from "@/api/coachSkill.api";
import type { FieldConfig } from "@/components/view-modal/types";

type Props = {
  isOpen: boolean;
  coachSkillId?: number;
  onClose: () => void;
};

const fields: FieldConfig<CoachSkill>[] = [
  { key: "coachSkillId", label: "Coach Skill ID", icon: Hash },
  { key: "coachId", label: "Coach ID", icon: User },
  { key: "activityId", label: "Activity ID", icon: Activity },
  { key: "experience", label: "Experience", icon: BookOpen },
  { key: "activityQualification", label: "Activity Qualification", icon: BookOpen },
  { key: "currentInterest", label: "Current Interest", icon: Heart },
  { key: "currentlyInTeam", label: "Currently In Team", icon: Users },
  {
    key: "wantsUsToManageBookings",
    label: "Wants Us To Manage Bookings",
    icon: CheckCircle,
    render: (v) => (v ? "Yes" : "No"),
  },
  { key: "detailsOfChargesExpected", label: "Charges Expected", icon: FileText },
  { key: "detailsOfServicesAvailable", label: "Services Available", icon: FileText },
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

export default function CoachSkillViewModal({
  isOpen,
  coachSkillId,
  onClose,
}: Props) {
  const fetchFn = useCallback(
    async (id?: number | string): Promise<CoachSkill> => {
      const useId = id ?? coachSkillId;
      if (!useId) throw new Error("Coach Skill ID missing");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await getCoachSkillById(Number(useId));

      // normalize: API may return { success, data } or raw coach skill
      if (res && res.data) return res.data as CoachSkill;

      return res as CoachSkill;
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
      title="Coach Skill Details"
      layout="grid"
    />
  );
}
