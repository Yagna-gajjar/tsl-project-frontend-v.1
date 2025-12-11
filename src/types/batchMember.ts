
export interface BatchMember {
  batchMemberId: number;
  enrollmentId: number;
  batchId: number;
  memberId: number;
  status: string;
  courseId: number;
  memberFirstName?: string;
  batchName: string;
  startTime: string;
  endTime: string;
  coachId: number;
  coachName: string;
  startDate: Date | string;
  endDate: Date | string;
  oldEnollmentEndDate: Date;
  newStartDate: Date;
  members: {
    batchMemberId: number;
    memberId: number;
    memberName: string;
  }[];
}