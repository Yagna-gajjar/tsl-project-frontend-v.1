// src/api/coachAssignment.api.ts
import type { CoachAssignment } from "@/types/coachAssignment";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

const BASE = import.meta.env.VITE_APP_API_URL + "/coach-assignment";

export interface CoachAssignmentQuery {
  page?: number;
  limit?: number;
  search?: string;
  coachId?: number;
  batchId?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export function getCoachAssignments(
  params: CoachAssignmentQuery = {}
): Promise<Response<CoachAssignment[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "coachAssignmentId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? undefined,
    coachId: params.coachId ?? undefined,
    batchId: params.batchId ?? undefined,
  });
  return request<Response<CoachAssignment[]>>(`${BASE}${qs}`);
}

export function getCoachAssignmentById(
  id: number
): Promise<Response<CoachAssignment>> {
  return request<Response<CoachAssignment>>(`${BASE}/${id}`);
}

export function createCoachAssignment(
  payload: Omit<
    CoachAssignment,
    "coachAssignmentId" | "createdAt" | "updatedAt"
  >
): Promise<Response> {
  return request<Response>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCoachAssignment(
  id: number,
  payload: Partial<CoachAssignment>
): Promise<Response> {
  return request<Response>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteCoachAssignment(id: number): Promise<Response> {
  return request<Response>(`${BASE}/${id}`, {
    method: "DELETE",
  });
}
