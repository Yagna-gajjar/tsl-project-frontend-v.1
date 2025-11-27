export interface CoachSkill {
  coachSkillId: number;
  coachId: number;
  activityId: number;
  activityQualification?: string;
  experience: string;
  currentInterest?: string;
  currentlyInTeam?: string;
  wantsUsToManageBookings: boolean;
  detailsOfChargesExpected?: string;
  detailsOfServicesAvailable?: string;
  createdAt?: Date;
  updatedAt?: Date;
  coachFirstName: string;
  coachLastName: string;
  activityName: string;
}
