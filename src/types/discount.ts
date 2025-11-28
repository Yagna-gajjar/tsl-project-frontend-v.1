export interface Discount {
  discountId: number;
  aboveUnits: number;
  courseId: number;
  courseName?: string;
  discountPercentage: number;
  introduceDate: Date;
  suspendDate?: Date;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}
