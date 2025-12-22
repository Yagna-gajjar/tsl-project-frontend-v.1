export interface MembershipLink {
  membershipLinkId?: number;
  membershipMasterId: number;
  membershipId?: number;
  linkDate: Date | string;
  dLinkDate: Date | string;
  accountId: number;

  membershipType?: string;
  accountName?: string;
  membershipName?: string;
}