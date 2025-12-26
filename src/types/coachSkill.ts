export interface CoachSkill {
  coachSkillId?: number;
  memberId: number;
  activityId: number;
  activityQualification?: string;
  experience: string;
  currentlyInterest?: string;
  currentlyInTeam?: string;
  wantsUsToManageBookings: boolean;
  detailsOfChargesExpected?: string;
  detailsOfServicesAvailable?: string;
  status?: string;
  createdBy?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  memberFirstName: string;
  memberLastName: string;
  activityName: string;
}