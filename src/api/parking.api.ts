import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";
import type { Parking } from "@/types/parking";

export interface ParkingQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sorting?: SortOrder;
  search?: string;
  vehicleNumber?: string;
  parkingId?: string;
  memberId?: string;
  paymentAmount?: string;
  startDate?: string;
}

const PARKING_BASE = import.meta.env.VITE_APP_API_URL + "/parking";

export function getParking(
  params: ParkingQuery = {}
): Promise<Response<Parking>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "activityId",
    sorting: params.sorting ?? params.sorting ?? "ASC",
    search: params.search ?? params.vehicleNumber,
    parkingId: params.parkingId ?? undefined,
    memberId: params.memberId ?? undefined,
    paymentAmount: params.paymentAmount ?? undefined,
    startDate: params.startDate ?? undefined,
  });

  return request<Response<Parking>>(`${PARKING_BASE}${qs}`);
}

export function getParkingById(id: number): Promise<Response> {
  return request<Response>(`${PARKING_BASE}/${id}`);
}

export function createParking(payload: Parking): Promise<Response> {
  return request<Response>(PARKING_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function editParking(
  id: number,
  payload: Partial<Parking>
): Promise<Response> {
  return request<Response>(`${PARKING_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteParking(id: number): Promise<Response> {
  return request<Response>(`${PARKING_BASE}/${id}`, {
    method: "DELETE",
  });
}
