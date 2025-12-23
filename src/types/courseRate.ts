export interface CourseRate {
  courseRateId?: number;
  courseId: number;
  membershipMasterId?: string | number;
  aboveUnits: number;
  unitRate: number;
  introduceDate: string;
  suspensionDate?: Date | string | undefined;
  daySelection: boolean;
  enrChangesAllowed?: number;
  enrFreezingAllowed?: number;
  minDaysInEnr: number;
  discountOnDayReduce: number;
  status?: string;
  freezing?: number;
  createdAt?: string;
  updatedAt?: string;

  membershipType?: string | null;
  courseName?: string;
}