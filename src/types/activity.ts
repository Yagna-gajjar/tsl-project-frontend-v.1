export interface Activity {
  activityId: number;
  activityName: string;
  activityType:
    | "art"
    | "child development"
    | "fitness"
    | "performing arts"
    | "recreation"
    | "self development"
    | "services"
    | "sports"
    | "tsl charges";
  description?: string;
  activeCourses: number;
  cgst: number;
  sgst: number;
  srgst: number;
  availableCoaches: number;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}