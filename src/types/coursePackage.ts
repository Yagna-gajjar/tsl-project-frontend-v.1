export interface CoursePackage {
  coursePackageId?: number;
  courseId: number;
  linkType: string;
  batchId?: number | null;
  approvalAuthorityId?: number;
  status?: string;
  memberFirstName?: string;
  memberLastName?: string;
  createdBy?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  activityId?: string | undefined;
  courseName?: string;
  batchName?: string;
  authorityFirstName?: string;
  authorityLastName?: string;
  authorityName?: string;
}