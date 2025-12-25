export interface Batch {
  batchId?: number;
  batchType: string | null;
  entityId: number | null;
  activityId: number | null;
  membershipMasterId?: number | null;
  courseId?: number | null;
  batchName: string;
  startTime: string;
  endTime: string;
  sessionMinutes: number;
  daysPerWeek: number;
  daysPattern: number | string | null;
  maxCapacity: number;
  admissionCriteria?: string | null;
  introduceDate: Date | string;
  suspendedDate?: Date | string | null;
  status?: string;
  createdBy?: number | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  activeMemberCount?: number;
  entityName?: string;
  courseName?: string;
  activityName?: string;
  areaName?: string;
  facilityName?: string;
  coachName?: string;
}