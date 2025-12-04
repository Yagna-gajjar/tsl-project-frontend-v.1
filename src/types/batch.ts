export interface Batch {
  batchId: number;
  activityName: string;
  academyId: number;
  courseId: number;
  coachId: number;
  batchName: string;
  facilityId: number;
  areaId: number;
  introduceDate: Date;
  suspendedDate: Date;
  startTime: Date;
  endTime: Date;
  weekDays: number;
  status: "active" | "suspended";
  createdAt: Date;
  updatedAt: Date;

  batchCapacity: number,
  activeMemberCount: number,
  academyName: string;
  areaName?: string;
  facilityName?: string;
  coachFirstName?: string;
  coachLastName?: string;
  courseName?: string;
}
