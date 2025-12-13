export interface MembershipMaster {
  membershipMasterId?: number;

  membershipType: string;
  identityTypeId?: number;

  introductionDate: Date | string;
  suspensionDate: Date | string;

  billingEntityOfFamily?: string;

  membershipDetails: string;

  durationDays: number;
  minDeposite: number;
  minIssueCharge: number;
  perMemberRegCharge: number;
  commPerMonthPerMember?: number;
  memberLimit?: number;
  commDiscountPerMember?: number;
  decreaseCommByPR?: number;
  feePaymentComm?: number;
  minCBalance: number;
  giftVoucher?: number;

  bookingDiscount: number;
  graceDays: number;
  regMemberIncluded: number;

  guardianEntry: boolean;

  guestAllowed: boolean;
  rfid: string;
  clubAccess: boolean;

  birthdayVenueUsage: number;
  anniversaryVenueUsage: number;

  cancellationCharges: number;

  createdAt?: Date;
  updatedAt?: Date;
}
