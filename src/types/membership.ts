export interface membership {
  membershipId: number;
  membershipMasterId: number;
  accountId: number | null;
  startDate: Date | string;
  endDate?: Date | string;
  graceDate?: Date | string;
  cancelationDate?: Date | string | null;
  members: number;
  totalIssueCharges: number;
  appDiscount: number;
  totalFBalance: number;
  totalCBalance: number;
  totalSpentCa: number;
  caDepositPRRequiredFBalance: number;
  caDepositPRRequiredCBalance: number;
  depositeReq: number;
  qualifyingRecieptNo?: number;
  refundPaymentNo?: number;
  vBalPrInCa: number;
  status: string;
  actualFBalance?: number | null;
  actualCBalance?: number | null;
  refundedAmount?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: number;

  membershipType?: string;
  accountName?: string;
}