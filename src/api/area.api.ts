import type { Area } from "@/types/area";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface AreasQuery {
  page?: number;
  limit?: number;
  search?: string;
  areaName?: string;
  facilityId?: number;
  areaSQFT?: number;
  portion?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

const AREA_BASE = import.meta.env.VITE_APP_API_URL + "/area";

export function getAreas(params: AreasQuery = {}): Promise<Response<Area[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "areaId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? params.areaName,
    areaName: params.areaName ?? undefined,
    facilityId: params.facilityId ?? undefined,
    areaSQFT: params.areaSQFT ?? undefined,
    portion: params.portion ?? undefined,
  });

  return request<Response<Area[]>>(`${AREA_BASE}${qs}`);
}

export function getAreaById(id: number): Promise<Response<Area>> {
  return request<Response<Area>>(`${AREA_BASE}/${id}`);
}

export function createArea(
  payload: Omit<Area, "areaId" | "createdAt" | "updatedAt">
): Promise<Response<Area>> {
  return request<Response<Area>>(AREA_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateArea(
  id: number,
  payload: Partial<Area>
): Promise<Response<Area>> {
  return request<Response<Area>>(`${AREA_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteArea(id: number): Promise<Response<Area>> {
  return request<Response<Area>>(`${AREA_BASE}/${id}`, {
    method: "DELETE",
  });
}
