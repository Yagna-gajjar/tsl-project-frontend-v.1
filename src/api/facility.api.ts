import type { Facility } from "@/types/facility";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface FacilitiesQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  facilityName?: string;
  facilityType?: string;
  areaSQFT?: number | string;
  academicCapacity?: number | string;
}

const FACILITY_BASE = import.meta.env.VITE_APP_API_URL + "/facility";

export function getFacilities(params: FacilitiesQuery = {}): Promise<Response<Facility[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "facilityId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search,
    facilityName: params.facilityName,
    facilityType: params.facilityType,
    areaSQFT: params.areaSQFT,
    academicCapacity: params.academicCapacity,
  });  

  return request<Response<Facility[]>>(`${FACILITY_BASE}${qs}`);
}
export function getFacilityById(id: number | string): Promise<Response> {
  return request<Response>(`${FACILITY_BASE}/${id}`);
}

export function createFacility(payload: Facility): Promise<Response> {
  return request<Response>(FACILITY_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateFacility(id: number | string, payload: Partial<Facility>): Promise<Response> {
  return request<Response>(`${FACILITY_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteFacility(id: number | string): Promise<Response> {
  return request<Response>(`${FACILITY_BASE}/${id}`, {
    method: "DELETE",
  });
}
