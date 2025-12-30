
export interface BatchMember {
  batchMemberId?: number;
  enrollmentNo: number;
  batchId: number;
  memberId: number;
  status?: string;
  courseId?: number;
  memberFirstName?: string;
  batchName?: string;
  startTime: string;
  endTime: string;
  coachName?: string;
  startDate: Date | string;
  sessions: number;
  level: number,
  daysPattern: number;
  endDate: Date | string;
  createdBy?: number | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}