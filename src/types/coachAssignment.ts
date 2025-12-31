export interface CoachAssignment {
  academyCoachesId?: number;
  coachAssignmentId?: number;
  coachId?:number;
  accountMemberId?: number | null;
  batchId?: number | null;
  designation?: string | null;
  responsibilities?: string | null;
  cost?: number | null;
  startDate?: string | null | undefined;
  endDate?: string | null | undefined;
  remarks?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  createdBy?: number | null;
  status?: string;

  coachName?: string | null;
  batchName?: string | null;
}
