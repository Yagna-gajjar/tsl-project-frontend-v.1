export interface CoachAssignment {
  academyCoachesId: number;
  coachAssignmentId: number;
  coachId?: number | null;
  batchId?: number | null;
  designation?: string | null;
  responsibilities?: string | null;
  cost?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  remarks?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;

  coachName?: string | null;
  batchName?: string | null;
}
