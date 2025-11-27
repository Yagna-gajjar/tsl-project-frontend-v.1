export interface Course {
  courseId: number;
  academyId?: number;
  activityId?: number;
  courseName: string;
  description?: string;
  durationType: string;
  durationDays?: number;
  sessionCount?: number;
  daysPerWeek?: number;
  level?: string;
  gender?: string;
  ageGroup?: string;
  status?: string;
  fees: number;
  createdAt?: Date;
  updatedAt?: Date;
}
