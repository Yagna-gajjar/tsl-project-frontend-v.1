export interface CourseRate {
  courseRateId: number;
  courseId: number;
  membershipMasterId?: string | number;
  aboveUnits: number;
  unitRate: number;
  introduceDate: string;
  changable: boolean;
  freezing: number;
  createdAt: string;
  updatedAt: string;

  membershipType?: string | null;
  courseName?: string;
}