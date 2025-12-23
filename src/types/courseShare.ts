export interface CourseShare {
  courseShareId?: number;
  courseId: number;
  entityId: number;
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
  createdAt?: Date;
  updatedAt?: Date;

  entityName?: string;
  courseName?: string;
}
