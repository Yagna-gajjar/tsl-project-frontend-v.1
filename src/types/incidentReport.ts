export interface IncidentReport {
  incidentId?: number;
  incidentType: string;
  incidentReportedByMemberId?: number;
  incidentReportedByName?: string;
  incidentAgainstMemberId?: number;
  incidentAgainstName?: string;
  reporterStatement?: string;
  accusedStatement?: string;
  tslVerdict?: string;
  incidentDescription?: string;
  reportedDate?: Date | string;
  resolvedDate?: Date | string;
  status?: string;
  proofFile?: string;
  academyId?: number;
  batchId?: number;
  handledByUserId?: number;
  remarks?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  // Joined / read-only display fields returned by the API — never sent back
  // on create/update (see incidentReport.api.ts's Omit<...>).
  reportedByMemberFirstName?: string;
  reportedByMemberLastName?: string;
  againstMemberFirstName?: string;
  againstMemberLastName?: string;
  academyName?: string;
  batchName?: string;
  handledByUsername?: string;
}