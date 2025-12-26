import type {
  FacilityAllotment,
} from "@/types/facilityAllotment";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

const BASE = import.meta.env.VITE_APP_API_URL + "/facility-allotment";

export interface FacilityAllotmentQuery {
  page?: number;
  limit?: number;
  search?: string;
  facilityId?: number;
  areaId?: number;
  batchId?: number;
  assignmentDate?: string;
  unAssignmentDate?: string;
  sortBy?: string;
  level?: number;
  sortOrder?: SortOrder;
}

export function getFacilityAllotments(
  params: FacilityAllotmentQuery = {}
): Promise<Response<FacilityAllotment[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "facilityAllotmentId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? undefined,
    facilityId: params.facilityId ?? undefined,
    level: params.level ?? undefined,
    areaId: params.areaId ?? undefined,
    batchId: params.batchId ?? undefined,
    assignmentDate: params.assignmentDate ?? undefined,
    unAssignmentDate: params.unAssignmentDate ?? undefined,
  });

  return request<Response<FacilityAllotment[]>>(`${BASE}${qs}`);
}

export function getFacilityAllotmentById(
  id: number
): Promise<Response<FacilityAllotment>> {
  return request<Response<FacilityAllotment>>(`${BASE}/${id}`);
}

export function createFacilityAllotment(
  payload: Omit<
    FacilityAllotment,
    "facilityAllotmentId" | "createdAt" | "updatedAt"
  >
): Promise<Response> {
  return request<Response>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateFacilityAllotment(
  id: number,
  payload: Partial<FacilityAllotment>
): Promise<Response> {
  return request<Response>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteFacilityAllotment(id: number): Promise<Response> {
  return request<Response>(`${BASE}/${id}`, {
    method: "DELETE",
  });
}