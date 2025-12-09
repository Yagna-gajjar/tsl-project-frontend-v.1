export interface membership {
  membershipId: number;
  membershipMasterId: number;
  familyId: number;
  startDate: Date | string;
  endDate: Date;
  graceDate: Date;
  committedAmount: number;
  issueCharge: number;
  minVBalance: number;
  minFBalance: number;
  minCBalance: number;
  paymentId: string;
  status: string;
  cancellationDate: Date;
  actualFBalance: number;
  actualCBalance: number;
  refundedAmount: number;
  refundedPaymentId: number;
  cancellationCharges: number;
  createdAt: Date;
  updatedAt: Date;
}