import { useCallback, useState } from "react";
import {
  ViewModal,
  type FieldConfig,
} from "@/components/view-modal/view-modal";
import type { Family } from "@/types/family";
import { Badge } from "@/components/ui/badge";
import MemberFormModal from "../members/member-form-modal";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Users,
  Calendar,
  BadgeInfo,
  User,
  Type,
  Briefcase,
  FileText,
  Phone,
  StickyNote,
  Mail,
  Languages,
  Clock,
} from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item?: Family | null;
};

const baseViewFields: FieldConfig<Family | any>[] = [
  {
    key: "addMember",
    label: "Expand Family",
    type: "button",
    icon: Plus,
    button: {
      label: "Add Member",
      variant: "default",
      size: "sm",
      span: 1,
      onClick: undefined,
    },
  },
  {
    key: "viewMember",
    label: "View All Members",
    type: "button",
    icon: Users,
    button: {
      label: "View Member",
      variant: "default",
      size: "sm",
      span: 1,
      onClick: undefined,
    },
  },

  { key: "familyName", label: "Family Name", icon: User },
  { key: "familyTypeName", label: "Family Type", icon: Type },
  { key: "teamCategoryName", label: "Team Category", icon: Users },
  { key: "identityTypeName", label: "Identity Type", icon: BadgeInfo },
  { key: "profession", label: "Profession", icon: Briefcase },
  { key: "professionDetails", label: "Profession Details", icon: FileText },
  { key: "designation", label: "Designation", icon: Type },
  { key: "emergencyContact", label: "Emergency Contact", icon: Phone },
  { key: "remarks", label: "Remarks", icon: StickyNote },
  { key: "email", label: "Email", icon: Mail },

  {
    key: "status",
    label: "Status",
    icon: BadgeInfo,
    render: (value: any) =>
      typeof value === "string" ? (
        <Badge variant={value === "active" ? "default" : "secondary"}>
          {String(value)}
        </Badge>
      ) : (
        String(value ?? "-")
      ),
  },

  { key: "preferredLanguage", label: "Preferred Language", icon: Languages },

  {
    key: "createdAt",
    label: "Created At",
    icon: Calendar,
    render: (value: any) => (value ? new Date(value).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Clock,
    render: (value: any) => (value ? new Date(value).toLocaleString() : "-"),
  },
];

export default function FamilyViewModal({ isOpen, onClose, item }: Props) {
  const fetchFn = useCallback(
    async (id?: number | string) => {
      if (!item) throw new Error("No data");
      return item;
    },
    [item]
  );

  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [memberInitialData, setMemberInitialData] =
    useState<Partial<any> | null>(null);

  const openAddMemberForFamily = (family: Family | undefined | null) => {
    if (!family) return;
    setMemberInitialData({
      familyId: family.familyId,
    });
    setMemberFormOpen(true);
  };
  const navigate = useNavigate();
  const fields = baseViewFields.map((f) => {
    if (f.key === "addMember") {
      return {
        ...f,
        button: {
          ...f.button,
          onClick: (row: Family) => {
            openAddMemberForFamily(row ?? item ?? null);
          },
        },
      } as FieldConfig<Family>;
    } else if (f.key === "viewMember") {
      return {
        ...f,
        button: {
          ...f.button,
          onClick: (row: Family) => {
            const familyId = row?.familyId ?? item?.familyId;
            if (!familyId) return;

            navigate(`/member?familyId=${familyId}`);
          },
        },
      } as FieldConfig<Family>;
    }

    return f;
  });

  return (
    <>
      <ViewModal<Family>
        isOpen={isOpen}
        onClose={onClose}
        itemId={Number(item?.familyId)}
        fetchFn={fetchFn}
        fields={fields as any}
        title="View Family"
      />

      <MemberFormModal
        isOpen={memberFormOpen}
        onClose={() => {
          setMemberFormOpen(false);
          setMemberInitialData(null);
        }}
        initialData={memberInitialData}
        onSaved={() => {
          setMemberFormOpen(false);
        }}
      />
    </>
  );
}
