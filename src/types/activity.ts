import { ActivityCategory } from "./enums";

export interface Activity {
	activityId: number;
	activityName: string;
	activityType: ActivityCategory;
	description?: string;
	activeCourses: number;
	availableCoaches: number;
	createdAt?: Date;
	updatedAt?: Date;
}