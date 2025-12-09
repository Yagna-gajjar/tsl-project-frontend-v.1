export interface Enrollment {
  enrollmentId?: number;
  enrollmentDate: Date;
  startDate: Date;
  endDate: Date;
  academyId: number;
  courseId: number;
  batchId: number;
  memberId: number;
  discountId?: number;
  freeDays: number;
  sessionUnits: number;
  numberOfDays: number;
  discountedAmount: number;
  commitedAmount: number;
  openEnrollment: boolean;
  batchName?: string;
  status: string;
  cndn: number;
  debitAmount?: number;
  billingRate: number;
  billingAmount: number;
  adjustment: number;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;

  memberFirstName?: string;
  memberLastName?: string;
  courseName?: string;
  academyName?: string;
  activityName?: string;
  isDiscounted?: false;
  remainingAmount?: number;
  processingCharge?: number;
  changeType?: string;
  memberName?: string;
  oldEnrollmentId?: number | null;
}
