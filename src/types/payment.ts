export interface Payment {
  paymentId: number;
  amount: number;
  paymentMode: string;
  paymentType: string;
  transactionId?: string | null;
  paymentRemarks?: string | null;
  enrollmentId: number;
  createdAt: Date;
}