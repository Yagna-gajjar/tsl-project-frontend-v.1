export type CoachMember = {
  coachSkillId: number;
  accountMemberId: number;
  memberId: number;
  accountId: number;
  memberFirstName: string;
  memberMiddleName: string | null;
  memberLastName: string;
  accountName: string | null;
  entityId: number | null;
  activity: string | null;
  activityQualification: string | null;
  experience: string | number | null;
  currentlyIntreset: string | null;
};
