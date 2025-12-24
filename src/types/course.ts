export interface Course {
  courseId?: number;
  accountId?: number;
  courseType?: string | null;
  activityId: number;
  classification?: string | null;
  entityId: number;
  introduceDate: string;
  suspensionDate?: string | null;
  courseName: string;
  chargingPattern?: string | null;
  sessionMinutes: number;
  noOfDaysInWeek: number;
  daysPattern?: string | null;
  maxPerson?: number | null;
  unitsMultipleOf?: number;
  batchCapacity: number;
  totalParallelBatches: number;
  minAge: number;
  maxAge: number;
  gender?: "Male" | "Female" | "Any" | null;
  balanceUsable?: string | null;
  enrApprovalRequired?: boolean;
  cgstRate?: number;
  sgstRate?: number;
  status?: string | null;
  avbFrom?: string | null;
  avbTo?: string | null;
  createdBy?: number | null;
  createdAt?: string;
  updatedAt?: string;

  activityName?: string;
  entityName?: string;
}