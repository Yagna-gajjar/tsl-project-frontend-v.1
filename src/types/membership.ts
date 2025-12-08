export interface membership {
  membershipId: number;
  membershipMasterId: number;
  familyId: number;
  startDate: Date;
  endDate: Date;
  graceDate: Date;
  committedAmount: number;
  issueCharges: number;
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