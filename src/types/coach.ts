export interface Coach {
  coachId: number;
  coachFirstName: string;
  coachMiddleName?: string;
  coachLastName?: string;
  email?: string;
  contactNumber?: string;
  dob?: Date;
  joinDate?: Date;
  remarks?: string;
  status?: "active" | "inactive" | "suspended";
  gender?: "male" | "female" | "other";
  bloodGroup?: "b+" | "b-" | "a+" | "a-" | "o+" | "o-" | "ab+" | "ab-";
  aadharCard?: string;
  qualification?: string;
  achievements?: string;
  achievementsInDetails?: string;
  photo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
