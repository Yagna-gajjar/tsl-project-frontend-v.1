export interface Enrollment {
  enrollmentId: number;
  enrollmentDate: Date;
  startDate: Date;
  memberFirstName?: string;
  memberLastName?: string;
  courseName?: string;
  academyName?: string;
  endDate?: Date;
  academyId: number;
  courseId: number;
  memberId: number;
  discountId?: number;
  freeDays: number;
  sessionUnits: number;
  discountAmount: number;
  committedAmount: number;
  openEnrollment: boolean;
  remark?: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}
