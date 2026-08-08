import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import { getMembershipLinkById } from "@/api/membershipLink.api";
import type { MembershipLink } from "@/types/membershipLink";
import type { FieldConfig } from "@/components/view-modal/types";
import type { Response } from "@/types/response";
import { Link, User } from "lucide-react";

type Props = {
  isOpen: boolean;
  membershipLinkId?: number;
  onClose: () => void;
};

const fields: FieldConfig<MembershipLink>[] = [
  { key: "membershipType", label: "Membership Master", icon: Link },
  { key: "membershipId", label: "Membership", icon: Link },
  { key: "accountId", label: "Account", icon: User },
  { key: "linkDate", label: "Link Date", icon: Link },
  { key: "dLinkDate", label: "D-Link Date", icon: Link },
];

export default function MembershipLinkViewModal({
  isOpen,
  membershipLinkId,
  onClose,
}: Props) {
  const fetchFn = useCallback(async () => {
    const res: Response<MembershipLink> = await getMembershipLinkById(
      Number(membershipLinkId)
    );
    return res.data;
  }, [membershipLinkId]);

  return (
    <ViewModal
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(membershipLinkId)}
      fetchFn={fetchFn as any}
      fields={fields}
      title="View Membership Link"
    />
  );
}
