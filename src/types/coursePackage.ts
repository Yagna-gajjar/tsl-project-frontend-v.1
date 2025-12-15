export interface CoursePackage {
  coursePackageId: number;
  courseId: number;
  linkType: string;
  activityId?: number;
  createdAt: string;
  updatedAt: string;

  courseName?: string;
}