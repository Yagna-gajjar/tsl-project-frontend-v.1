import { useCallback } from "react";
import { Hash, Calendar, Users } from "lucide-react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { AccountMember } from "@/types/accountMember";
import { getAccountMemberById } from "@/api/accountMember.api";
import type { FieldConfig } from "@/components/view-modal/types";

const fields: FieldConfig<AccountMember>[] = [
  { key: "accountMemberId", label: "ID", icon: Hash },
  { key: "memberFirstName", label: "Member", icon: Users },
  { key: "accountName", label: "Account", icon: Users },
  { key: "relationship", label: "Relationship" },
  {
    key: "linkBilling",
    label: "Billing Linked",
    render: (v) => (v ? "Yes" : "No"),
  },
  { key: "linkDate", label: "Link Date", icon: Calendar },
  { key: "dlinkDate", label: "Delink Date", icon: Calendar },
  // { key: "createdAt", label: "Created", icon: Calendar },
  // { key: "updatedAt", label: "Updated", icon: Calendar },
];

export default function AccountMemberViewModal({
  isOpen,
  accountMemberId,
  onClose,
}: {
  isOpen: boolean;
  accountMemberId?: number;
  onClose: () => void;
}) {
  const fetchFn = useCallback(
    async (id?: number | string) => {
      const res = await getAccountMemberById(Number(id ?? accountMemberId));
      return res.data;
    },
    [accountMemberId]
  );

  return (
    <ViewModal<AccountMember>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(accountMemberId)}
      fetchFn={fetchFn as any}
      fields={fields}
      title="Account Member Details"
      layout="grid"
    />
  );
}
