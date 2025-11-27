export interface AcademyCoach {
  coachName?: string;
  academyCoachesId: number;
  coachId: number;
  academyId: number;
  academyName?: string;
  joiningDate: Date;
  relievedDate?: Date;
  designation: string;
  description?: string;
  rfid?: string;
  thumbprint?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
