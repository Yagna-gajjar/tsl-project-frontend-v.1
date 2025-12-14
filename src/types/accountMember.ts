export interface AccountMember {
  accountMemberId: number;
  memberId: number;
  accountId: number;
  linkDate: Date | string;
  dlinkDate?: Date | string | null;
  relationship: string;
  linkBilling: boolean;

  memberFirstName?: string;
  memberLastName?: string;
}
