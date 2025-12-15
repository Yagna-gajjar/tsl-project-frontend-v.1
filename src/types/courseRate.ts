export interface CourseRate {
	courseRateId: number;
	courseId: number;
	entityType?: string | null;
	aboveUnits: number;
	unitRate: number;
	introduceDate: string;
	changable: boolean;
	freezing: number;
	createdAt: string;
	updatedAt: string;

	courseName?: string;
}