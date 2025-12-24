export interface CoursePackage {
  coursePackageId?: number;
  courseId: number;
  linkType: string;
  batchId?: number|null;
  approvalAuthorityId?: number;
  status?: string;
  memberFirstName?: string;
  memberLastName?: string;
  createdBy?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  courseName?: string;
  batchName?: string;
}