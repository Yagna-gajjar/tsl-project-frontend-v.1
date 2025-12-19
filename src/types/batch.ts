export interface Batch {
  batchId: number;
  batchType: string;
  entityId: number;
  activityId: number;
  membershipIdshipId: number;
  courseId: number;
  batchName: string;
  introduceDate: Date | string;
  suspendedDate: Date | string;
  maxCapacity: number;
  startTime: Date | string;
  endTime: Date | string;
  daysPerWeek: number;
  daysPattern: string[] | number | undefined;
  admissionCriteria: string;
  status: "active" | "suspended" | "inactive" | "cancelled";
  photo: string | null;
  createdAt: Date;
  updatedAt: Date;

  batchCapacity: number;
  activeMemberCount: number;
  entityName: string;
  areaName?: string;
  facilityName?: string;
  coachName?: string;
  courseName?: string;
}
