export interface CourseShare {
  courseShareId: number;
  courseId: number;
  shareType?: string;
  academyId: number;
  share: number;
  createdAt: Date;
  updatedAt: Date;

  academyName?: string;
}
