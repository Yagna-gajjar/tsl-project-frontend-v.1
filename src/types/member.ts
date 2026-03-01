export interface Member {
  memberId?: number;
  regDate: Date | string;
  suspensionDate?: Date | string | null;
  memberFirstName: string;
  memberMiddleName?: string;
  memberLastName: string;
  dob: Date | string | undefined;
  email: string | undefined;
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  gender: string;
  personalStatus: string;
  personalStatusOrganization?: string;
  personalStatusSector?: string;
  mothertongue: string;
  qualification?: string;
  idProofType?: string;
  idProofNumber?: string;
  contactNumber?: string;
  transportMode: string | undefined;
  addressId: number | null | undefined;
  avatar?: string | null;
  remarks?: string;
  maritialStatus?: string;
  adminInstruction?: string;
  status: "active" | "inactive" | "block";
  createdAt?: Date;
  updatedAt?: Date;
  guardianMemberId?: number;
  introduceMemberId?: number;
  guarantorId?: number;
  guardianInfo?: string;
  indemnityInfo?: string;


  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  address?: string;
}