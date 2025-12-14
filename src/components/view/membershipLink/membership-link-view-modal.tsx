import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import { getMembershipLinkById } from "@/api/membershipLink.api";
import type { MembershipLink } from "@/types/membershipLink";
import type { FieldConfig } from "@/components/view-modal/types";
import type { Response } from "@/types/response";
import { Link, User, Hash } from "lucide-react";

type Props = {
  isOpen: boolean;
  membershipLinkId?: number;
  onClose: () => void;
};

const fields: FieldConfig<MembershipLink>[] = [
  { key: "membershipLinkId", label: "ID", icon: Hash },
  { key: "membershipMasterId", label: "Membership Master", icon: Link },
  { key: "membershipId", label: "Membership", icon: Link },
  { key: "accountId", label: "Account", icon: User },
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
      fetchFn={fetchFn}
      fields={fields}
      title="View Membership Link"
    />
  );
}
