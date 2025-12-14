export interface CoursePackage {
	coursePackageId: number;
	courseId: number;
	linkType: string;
	activityType?: string;
	createdAt: string;
	updatedAt: string;

	courseName?: string;
}