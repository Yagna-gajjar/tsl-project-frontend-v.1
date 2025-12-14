export interface Course {
  courseId: number;
  academyId?: number;
  activityId?: number;
  introductionDate: Date;
  suspendDate?: Date;
  courseName: string;
  typeOfCourse: string;
  minEnrollmentUnit: number;
  totalParallelBatches: number;
  classificationType: "Member Credits" | "Fees Only";
  chargingPattern: "Unit" | "Day" | "Session";
  sessionMinutes: number;
  noOfDaysInWeek: number;
  weekDays: number;
  unitRate: number;
  batchCapacity: number;
  minAge: number;
  maxAge: number;
  gender: "Male" | "Female" | "Couple" | "Open";
  status: "active" | "suspended";
  createdAt: Date;
  updatedAt: Date;

  academyName?: string;
  activityName?: string;
}
 