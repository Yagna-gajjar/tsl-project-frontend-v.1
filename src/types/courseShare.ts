export interface CourseShare {
  courseShareId: number;
  courseId: number;
  entityId: number;
  roleInCourse?: string;
  share: number;
  cgst: number;
  sgst: number;
  approvalAuthorityId: number;
  createdAt: Date;
  updatedAt: Date;

  academyName?: string;
}
