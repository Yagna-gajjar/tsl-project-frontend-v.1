export interface MembershipMaster {
  membershipMasterId?: number;

  membershipType: string;
  identityTypeId?: number;

  introductionDate: Date | string;
  suspensionDate: Date | string;

  billingEntityOfFamily?: string;

  membershipDetails: string;

  durationDays: number;
  caDepositPR: number;
  minIssueCharge: number;
  perMemberRegCharge: number;
  commPerMonthPerMember?: number;
  memberLimit?: number;
  DisOnCaUptoMembers?: number;
  disOnCaPerMember?: number;
  fBalPrInCa?: number;
  cBalPrInCa: number;
  vBalPrInCa?: number;

  bookingDiscount: number;
  graceDays: number;

  guestAllowed: boolean;
  clubAccess: boolean;

  birthdayVenueUsage: number;
  anniversaryVenueUsage: number;

  cancelChargesPrOnCa: number;

  createdAt?: Date;
  updatedAt?: Date;

  status?: string;
}
