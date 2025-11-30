import type { Academy } from "@/types/academy";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface AcademyQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sorting?: SortOrder;
  search?: string;
  academyName?: string;
  academyType?: string;
  activityName?: string;
}

const ACADEMY_BASE = import.meta.env.VITE_APP_API_URL + "/academy";

export function getAcademies(params: AcademyQuery = {}): Promise<Academy[]> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "academyId",
    sorting: params.sorting ?? "ASC",
    search: params.search ?? params.academyName,
    academyName: params.academyName ?? undefined,
    academyType: params.academyType ?? undefined,
    activityName: params.activityName ?? undefined,
  });

  return request<Academy[]>(`${ACADEMY_BASE}${qs}`);
}

export function getAcademyById(id: number): Promise<Response> {
  return request<Response>(`${ACADEMY_BASE}/${id}`);
}

export function createAcademy(
  payload: Omit<Academy, "academyId" | "createdAt" | "updatedAt">
): Promise<Response> {
  return request<Response>(ACADEMY_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAcademy(
  id: number,
  payload: Partial<Academy>
): Promise<Response> {
  return request<Response>(`${ACADEMY_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAcademy(id: number): Promise<Response> {
  return request<Response>(`${ACADEMY_BASE}/${id}`, {
    method: "DELETE",
  });
}
