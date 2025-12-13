// ✔ FILE UPDATED: membershipMaster.ts (your type/interface file)

export interface MembershipMaster {
  membershipMasterId?: number;

  // ---- Updated / Renamed to match DB ----
  membershipType: string;
  identityTypeId?: number; // added because DB has "IdentityTypeId"

  // ---- Updated to match "introductionDate" / "suspensionDate" ----
  introductionDate: Date | string; // renamed from introduceDate
  suspensionDate: Date | string; // renamed from suspendDate

  // ---- Added new fields from DB ----
  billingEntityOfFamily?: string; // VARCHAR(20)

  membershipDetails: string; // same as DB

  // ---- Renamed fields to match DB ----
  durationDays: number; // renamed from membershipDurationInDays
  minDeposite: number; // new from DB
  minIssueCharge: number; // DB field
  perMemberRegCharge: number; // new
  commPerMonthPerMember?: number; // optional since your DB allows NULL
  memberLimit?: number; // optional
  commDiscountPerMember?: number; // optional
  decreaseCommByPR?: number; // optional
  feePaymentComm?: number; // optional
  minCBalance: number; // same
  giftVoucher?: number; // new

  // ---- Existing fields that match DB ----
  bookingDiscount: number;
  graceDays: number;
  regMemberIncluded: number;

  // ---- Renamed (your field was spelled wrong) ----
  guardianEntry: boolean; // DB calls "gardianEntry" but correcting spelling in TS

  guestAllowed: boolean;
  rfid: string;
  clubAccess: boolean;

  // ---- Updated to match DB (changed type to number) ----
  birthdayVenueUsage: number; // DB uses INT
  anniversaryVenueUsage: number; // DB uses INT

  // ---- Renamed (your field had wrong spelling) ----
  cancellationCharges: number; // corrected

  // ---- Add timestamps for consistency ----
  createdAt?: Date;
  updatedAt?: Date;
}
