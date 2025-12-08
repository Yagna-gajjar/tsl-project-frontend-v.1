export interface Parking {
  parkingId?: number;
  memberId: number;
  vehicleType: string;
  vehicleNumber: string;
  status: string;
  remarks?: string;
  startDate: Date;
  endDate: Date;
  startTime: Date;
  entTime: Date;

  paymentId: number;
  paymentAmount: number;
  paymentMode: string;
  transactionId?: string;
  totalAmount: number;
  paid: number;
  remaining: number;
  paymentRemarks: string;
}