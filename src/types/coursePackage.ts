export interface CoursePackage {
  coursePackageId: number;
  courseId: number;
  linkType: string;
  activityId?: number;
  approvalAuthorityId?: number;
  createdAt: string;
  updatedAt: string;

  courseName?: string;
}