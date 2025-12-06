export interface Payment {
  paymentId?: number
  paymentType: string;
  enrollmentId?: number | null;
  paymentMode: string;
  transactionId?: string | null;
  totalAmount: number;
  paid: number;
  remaining: number;
  paymentRemarks?: string | null;
  createdAt?: string | Date;

  academyName?: string | null;
  courseName?: string | null;
  memberName?: string | null;
}
