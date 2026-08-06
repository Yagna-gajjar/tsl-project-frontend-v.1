import type { IncidentReport } from "@/types/incidentReport";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface IncidentReportQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  incidentId?: number;
  incidentType?: string;
  incidentReportedByMemberId?: number;
  incidentReportedByName?: string;
  incidentAgainstMemberId?: number;
  incidentAgainstName?: string;
  academyId?: number;
  academyName?: string;
  batchId?: number;
  batchName?: string;
  handledByUserId?: number;
  status?: string;
  reportedDateFrom?: string;
  reportedDateTo?: string;
  resolvedDateFrom?: string;
  resolvedDateTo?: string;
}

const INCIDENT_REPORT_BASE =
  import.meta.env.VITE_APP_API_URL + "/incident-report";

export function getIncidentReports(
  params: IncidentReportQuery = {}
): Promise<Response<IncidentReport[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "incidentId",
    sortOrder: params.sortOrder ?? "DESC",
    search: params.search ?? undefined,
    incidentId: params.incidentId ?? undefined,
    incidentType: params.incidentType ?? undefined,
    incidentReportedByMemberId: params.incidentReportedByMemberId ?? undefined,
    incidentReportedByName: params.incidentReportedByName ?? undefined,
    incidentAgainstMemberId: params.incidentAgainstMemberId ?? undefined,
    incidentAgainstName: params.incidentAgainstName ?? undefined,
    academyId: params.academyId ?? undefined,
    academyName: params.academyName ?? undefined,
    batchId: params.batchId ?? undefined,
    batchName: params.batchName ?? undefined,
    handledByUserId: params.handledByUserId ?? undefined,
    status: params.status ?? undefined,
    reportedDateFrom: params.reportedDateFrom ?? undefined,
    reportedDateTo: params.reportedDateTo ?? undefined,
    resolvedDateFrom: params.resolvedDateFrom ?? undefined,
    resolvedDateTo: params.resolvedDateTo ?? undefined,
  });

  return request<Response<IncidentReport[]>>(`${INCIDENT_REPORT_BASE}${qs}`);
}

export function getIncidentReport(
  id: number
): Promise<Response<IncidentReport>> {
  return request<Response<IncidentReport>>(`${INCIDENT_REPORT_BASE}/${id}`);
}

export function createIncidentReport(
  payload: Omit<
    IncidentReport,
    | "incidentId"
    | "createdAt"
    | "updatedAt"
    | "reportedByMemberFirstName"
    | "reportedByMemberLastName"
    | "againstMemberFirstName"
    | "againstMemberLastName"
    | "academyName"
    | "batchName"
    | "handledByUsername"
  >
): Promise<Response<IncidentReport>> {
  return request<Response<IncidentReport>>(INCIDENT_REPORT_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateIncidentReport(
  id: number,
  payload: Partial<
    Omit<
      IncidentReport,
      | "incidentId"
      | "createdAt"
      | "updatedAt"
      | "reportedByMemberFirstName"
      | "reportedByMemberLastName"
      | "againstMemberFirstName"
      | "againstMemberLastName"
      | "academyName"
      | "batchName"
      | "handledByUsername"
    >
  >
): Promise<Response<IncidentReport>> {
  return request<Response<IncidentReport>>(`${INCIDENT_REPORT_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteIncidentReport(
  id: number
): Promise<Response<IncidentReport>> {
  return request<Response<IncidentReport>>(`${INCIDENT_REPORT_BASE}/${id}`, {
    method: "DELETE",
  });
}