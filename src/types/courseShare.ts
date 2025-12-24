export interface CourseShare {
  courseShareId?: number;
  courseId: number;
  accountId: number;
  roleInCourse?: string;
  share: number;
  cgst?: number;
  sgst?: number;
  approvalAuthorityId?: number;
  tsl?: number;
  facility?: number;
  main?: number;
  joint?: number;
  status?: string;
  craetedBy?: number;
  createdBy?: number;
  createdAt?: Date;
  updatedAt?: Date;

  accountName?: string;
  courseName?: string;
}
