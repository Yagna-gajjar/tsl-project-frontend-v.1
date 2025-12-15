export interface Course {
  courseId: number;
  courseType?: string | null;
  classification?: string | null;
  academyId: number;
  activityName?: string | null;
  introduceDate: string;
  suspensionDate?: string | null;
  courseName: string;
  chargingPattern?: string | null;
  sessionMinutes: number;
  noOfDaysInWeek: number;
  availabilityPattern: string;
  minEnrollmentUnits: number;
  batchCapacity: number;
  totalParallelBatches: number;
  minAge: number;
  maxAge: number;
  gender?: "Male" | "Female" | "Any" | null;
  feeClassification?: string | null;
  createdAt: string;
  updatedAt: string;
}