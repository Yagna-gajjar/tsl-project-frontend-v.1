export interface Batch {
  batchId: number;
  batchType: string;
  activityName: string;
  academyId: number;
  courseId: number;
  batchName: string;
  introduceDate: Date | string;
  suspendedDate: Date | string;
  startTime: Date | string;
  endTime: Date | string;
  weekDays: string[] | number | undefined;
  photo: string | null;
  status: "active" | "suspended" | "inactive" | "cancelled";
  admisionCriteria: string;
  maxCapacity: number;
  createdAt: Date;
  updatedAt: Date;

  batchCapacity: number;
  activeMemberCount: number;
  academyName: string;
  areaName?: string;
  facilityName?: string;
  coachFirstName?: string;
  coachLastName?: string;
  courseName?: string;
}
