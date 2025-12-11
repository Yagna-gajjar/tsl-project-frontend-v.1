// src/api/appointment.api.ts
import type { Appointment } from "@/types/appointment";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

const BASE = import.meta.env.VITE_APP_API_URL + "/appointment";

export interface AppointmentQuery {
  page?: number;
  limit?: number;
  search?: string;
  enrollmentId?: number;
  batchId?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export function getAppointments(
  params: AppointmentQuery = {}
): Promise<Response<Appointment[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "appointmentId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? undefined,
    enrollmentId: params.enrollmentId ?? undefined,
    batchId: params.batchId ?? undefined,
  });

  return request<Response<Appointment[]>>(`${BASE}${qs}`);
}

export function getAppointmentById(id: number): Promise<Response<Appointment>> {
  return request<Response<Appointment>>(`${BASE}/${id}`);
}

export function createAppointment(
  payload: Omit<Appointment, "appointmentId" | "createdAt" | "updatedAt">
): Promise<Response> {
  return request<Response>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAppointment(
  id: number,
  payload: Partial<Appointment>
): Promise<Response> {
  return request<Response>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAppointment(id: number): Promise<Response> {
  return request<Response>(`${BASE}/${id}`, {
    method: "DELETE",
  });
}
