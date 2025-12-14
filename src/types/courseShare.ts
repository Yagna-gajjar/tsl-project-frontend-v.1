export interface CourseShare {
	courseShareId: number;
	shareType?: string;
	academyId: number;
	share: number;
	createdAt: Date;
	updatedAt: Date;

	academyName?: string;
}
