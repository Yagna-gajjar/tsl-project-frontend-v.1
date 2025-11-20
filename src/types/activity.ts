export interface Activity {
	activityId: number;
	activityName: string;
	activityType: 'art' | 'child development' | 'fitness' | 'performing arts' | 'recreation' | 'self development' | 'services' | 'sports' | 'tsl charges';
	description?: string;
	activeCourses: number;
	availableCoaches: number;
	createdAt?: Date;
	updatedAt?: Date;
}