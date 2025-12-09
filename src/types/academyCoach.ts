export interface AcademyCoach {
  coachName?: string;
  academyCoachesId?: number;
  coachId: number;
  academyId: number;
  academyName?: string;
  joiningDate: Date | string;
  relievedDate?: Date | string;
  designation: string;
  description?: string;
  rfid?: string;
  thumbprint?: string;
  createdAt?: Date;
  updatedAt?: Date;

  coachFirstName?: string;
  coachLastName?: string;
}
