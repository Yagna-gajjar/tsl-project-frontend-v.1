export interface Member {
  memberId: number;
  memberFirstName: string;
  memberMiddleName?: string;
  memberLastName: string;
  dob: Date;
  email: string;
  relationship?: string;
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  gender: "male" | "female" | "other";
  status: "active" | "inactive" | "block";
  schoolName?: string;
  qualification?: string;
  idProofType?:
  | "aadhar card"
  | "pan card"
  | "voter id"
  | "passport"
  | "driving license"
  | "other";
  idProofNumber?: string;
  contactNumber?: string;
  transportMode: "self drive" | "parents" | "van" | "walking" | "other";
  addressId: number;
  avatar?: string | null;
  remarks?: string;
  personalStatus?: string;
  createdAt?: Date;
  updatedAt?: Date;

  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
}	