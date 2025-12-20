export interface CourseRate {
  courseRateId: number;
  courseId: number;
  membershipMasterId?: string | number;
  aboveUnits: number;
  unitRate: number;
  introduceDate: string;
  changable: number;
  daySelection: boolean;
  enrChangesAllowed: number;
  enrFreezingAllowed: number;
  minDaysInEnr: number;
  discountOnDayReduce: number;
  status: string;
  freezing: number;
  suspensionDate: Date | string;
  createdAt: string;
  updatedAt: string;

  membershipType?: string | null;
  courseName?: string;
}