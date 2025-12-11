export interface Appointment {
  appointmentId: number;
  enrollmentId?: number | null;
  noOfPerson?: number | null;
  batchId?: number | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;

  enrollmentName?: string | null;
  batchName?: string | null;
}
