import type { AcademyCoach } from "@/types/academyCoach";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface AcademyCoachQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  coachName?: string;
  academyName?: string;
  designation?: string;
  academyId?: number;
}

const ACADEMY_COACH_BASE =
  import.meta.env.VITE_APP_API_URL + "/academy-coaches";

export function getAcademyCoaches(
  params: AcademyCoachQuery = {}
): Promise<Response<AcademyCoach[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "academyCoachesId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? undefined,
    coachName: params.coachName ?? undefined,
    academyName: params.academyName ?? undefined,
    designation: params.designation ?? undefined,
    academyId: params.academyId ?? undefined,
  });

  return request<Response<AcademyCoach[]>>(`${ACADEMY_COACH_BASE}${qs}`);
}

export function getAcademyCoachById(id: number): Promise<Response<AcademyCoach>> {
  return request<Response<AcademyCoach>>(`${ACADEMY_COACH_BASE}/${id}`);
}

export function createAcademyCoach(
  payload: Omit<AcademyCoach, "academyCoachesId" | "createdAt" | "updatedAt">
): Promise<Response<AcademyCoach>> {
  return request<Response<AcademyCoach>>(ACADEMY_COACH_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAcademyCoach(
  id: number,
  payload: Partial<
    Omit<AcademyCoach, "academyCoachesId" | "createdAt" | "updatedAt">
  >
): Promise<Response<AcademyCoach>> {
  return request<Response<AcademyCoach>>(`${ACADEMY_COACH_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAcademyCoach(id: number): Promise<AcademyCoach> {
  return request<AcademyCoach>(`${ACADEMY_COACH_BASE}/${id}`, {
    method: "DELETE",
  });
}
