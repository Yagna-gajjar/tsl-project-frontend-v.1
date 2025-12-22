export interface Authority {
  authorityId?: number;
  memberId: number;
  accountId: number;
  linkingDate?: Date | string;
  dlinkDate?: Date | string;
  level?: number;
  active?: string;

  memberFirstName?: string;
  memberLastName?: string;
  accountName?: string;
}