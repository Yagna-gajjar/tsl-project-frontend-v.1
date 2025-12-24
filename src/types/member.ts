export interface Member {
  memberId: number;
  regDate: Date | string;
  suspensionDate: Date | string;
  memberFirstName: string;
  memberMiddleName?: string;
  memberLastName: string;
  dob: Date | undefined;
  email: string | undefined;
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  gender: string;
  personalStatus: string;
  personalStatusOrganization?: string;
  personalStatusSector: string;
  mothertongue: string;
  qualification?: string;
  idProofType?: string;
  idProofNumber?: string;
  contactNumber?: string;
  transportMode: string;
  addressId: number;
  avatar?: string | null;
  remarks?: string;
  maratialStatus?: string;
  admitInstruction?: string;
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