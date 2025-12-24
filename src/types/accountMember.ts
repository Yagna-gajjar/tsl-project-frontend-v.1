export interface AccountMember {
  accountMemberId: number;
  memberId: number;
  accountId: number;
  accountName?: string;
  linkDate: Date | string;
  dlinkDate?: Date | string | null;
  relationship: string;
  linkBilling: boolean;
  authorityId: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  memberFirstName?: string;
  memberLastName?: string;
  ctcPerHr?: number;
  details?: string;
  status?: string;
  createdBy?: number;
}
