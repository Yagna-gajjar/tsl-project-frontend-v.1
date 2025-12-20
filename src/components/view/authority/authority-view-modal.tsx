import { ViewModal } from "@/components/view-modal/view-modal";
import type { Authority } from "@/types/authority";
import { getAuthorityById } from "@/api/authority.api";
import type { FieldConfig } from "@/components/view-modal/types";
import { Calendar, User, Building2 } from "lucide-react";

const fields: FieldConfig<Authority>[] = [
  { key: "memberName", label: "Member", icon: User },
  { key: "accountName", label: "Account", icon: Building2 },
  { key: "linkingDate", label: "Link Date", icon: Calendar },
  { key: "dlinkDate", label: "Delink Date", icon: Calendar },
  { key: "level", label: "Level" },
];

export default function AuthorityViewModal({
  isOpen,
  authorityId,
  onClose,
}: any) {
  return (
    <ViewModal<Authority>
      isOpen={isOpen}
      onClose={onClose}
      itemId={authorityId}
      fetchFn={(id) => getAuthorityById(id).then((r) => r.data!)}
      fields={fields}
      title="View Authority"
    />
  );
}
