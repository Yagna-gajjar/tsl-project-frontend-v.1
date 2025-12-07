export interface DebitNote {
  debitNoteId?: number;
  debitNoteDate: Date;
  debitNoteAcademyId: number;
  debitNoteType: string;
  coachId?: number | null;
  enrollmentId?: number;
  debitNoteAmount: number;
  debitNoteRemarks: string;
  createdAt?: Date;
  updatedAt?: Date;

  academyName?: string | undefined;
  coachName?: string | undefined;
}