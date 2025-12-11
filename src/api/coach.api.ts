import type { Coach } from "@/types/coach";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface CoachesQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;

  coachFirstName?: string;
  status?: string;
}

const COACH_BASE = import.meta.env.VITE_APP_API_URL + "/coach";

export function getCoaches(params: CoachesQuery = {}): Promise<Response> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    sortBy: params.sortBy ?? "coachId",
    sortOrder: params.sortOrder ?? "ASC",

    search: params.search,
    coachFirstName: params.coachFirstName,
    status: params.status,
  });

  return request<Response>(`${COACH_BASE}${qs}`);
}

export function getCoachById(id: number): Promise<Response> {
  return request<Response>(`${COACH_BASE}/${id}`);
}

export function createCoach(
  payload: Omit<Coach, "coachId" | "createdAt" | "updatedAt">
): Promise<Response> {
  return request<Response>(COACH_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCoach(
  id: number,
  payload: Partial<Coach>
): Promise<Response> {
  return request<Response>(`${COACH_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteCoach(id: number): Promise<Coach> {
  return request<Coach>(`${COACH_BASE}/${id}`, {
    method: "DELETE",
  });
}

export function saveUrlToCoach(formData: FormData): Promise<Response> {
  return request<Response>(`${COACH_BASE}/photo`, {
    method: "POST",
    body: formData as unknown as string,
  });
}

export function deletePhoto(coachId: number, photo: string): Promise<Response> {
  return request<Response>(`${COACH_BASE}/remove`, {
    method: "POST",
    body: JSON.stringify({ coachId, photo }),
  });
}