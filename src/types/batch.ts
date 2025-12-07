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
  photo: string | null;
  status: "active" | "suspended" | "inactive" | "cancelled";
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
