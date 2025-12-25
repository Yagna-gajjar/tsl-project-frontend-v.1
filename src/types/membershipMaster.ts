export interface MembershipMaster {
  membershipMasterId?: number;
  membershipType: string;
  entityId?: number;
  introductionDate: Date | string;
  suspensionDate?: Date | string;
  billingEntityOfFamily?: string;
  membershipDetails: string;
  durationDays: number;
  caDepositPR: number;
  minIssueCharge: number;
  perMemberRegCharge: number;
  commPerMemberPerMonth?: number;
  memberLimit?: number;
  disOnCaUptoMembers?: number;
  descreaseCaByPercentage?: number;
  fBalPrInCa?: number;
  cBalPrInCa: number;
  vBalPrInCa?: number;
  graceDays: number;
  guestAllowed: number;
  clubAccess: boolean;
  birthdayVenueUsage: number;
  anniversaryVenueUsage: number;
  cancelChargesPrOnCa: number;
  status?: string;
  createdBy?: number;
  createdAt?: Date;
  updatedAt?: Date;

  entityName: string;
  entityType?:string;
}
