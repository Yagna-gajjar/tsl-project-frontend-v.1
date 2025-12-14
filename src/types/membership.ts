export interface membership {
  membershipId: number;

  membershipMasterId: number;
  accountId: number;

  startDate: Date | string;
  endDate?: Date | string;
  graceDate?: Date | string;
  cancelationDate?: Date | string | null;

  members: number;

  totalIssueCharges: number;
  appDiscount: number;

  totalFBalance: number;
  totalCBalance: number;
  totalSpendComm: number;

  minDepositeRequiredFBalance: number;
  minDepositeRequiredCBalance: number;
  depositeReq: number;

  giftVouchers: number;

  status: "active" | "inactive" | "cancelled" | string;

  actualFBalance?: number | null;
  actualCBalance?: number | null;
  refundedAmount?: number | null;

  createdAt: Date | string;
  updatedAt: Date | string;
}