export interface membership {
  membershipId: number;
  membershipMasterId: number;
  familyId: number;
  startDate: Date | string;
  endDate: Date | string;
  graceDate: Date | string;
  committedAmount: number;
  issueCharge: number;
  minVBalance: number;
  minFBalance: number;
  minCBalance: number;
  paymentId: string | number;
  status: string;
  cancellationDate: Date | string;
  actualFBalance: number;
  actualCBalance: number;
  refundedAmount: number;
  refundedPaymentId: number;
  cancellationCharges: number;
  createdAt: Date;
  updatedAt: Date;
}