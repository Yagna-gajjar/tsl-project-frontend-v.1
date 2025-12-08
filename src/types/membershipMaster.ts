export interface membershipMaster {
  membershipMasterId?: number;
  membershipType: string;
  introduceDate: Date | string;
  suspendDate: Date | string;
  membershipDetails: string;
  membershipDurationInDays: number;
  issueCharge: number;
  minFBalance: number;
  minCBalance: number;
  minVBalance: number;
  bookingDiscount: number;
  graceDays: number;
  regMemberIncluded: number;
  guardianEntry: boolean;
  guestAllowed: boolean;
  rfid: string;
  clubAccess: boolean;
  birthdayVenueUsage: boolean;
  anniversaryVenueUsage: boolean;
  cancallationCharges: number;
  createdAt: Date;
  updatedAt: Date;
}