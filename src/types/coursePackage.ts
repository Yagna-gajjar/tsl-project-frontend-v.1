export interface CoursePackage {
  coursePackageId?: number;
  courseId: number;
  linkType: string;
  activityId?: number;
  approvalAuthorityId?: number;
  status?: string;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;

  courseName?: string;
}