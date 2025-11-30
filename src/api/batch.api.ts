import type { Batch } from '@/types/batch';
import { request, toQueryString, type SortOrder } from './helper';
import type { Response } from '@/types/response';

export interface BatchQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  batchName?: string;
  coachFirstName?: string;
  facilityName?: string;
  courseName?: string;
  courseId?: number;
}

const BATCH_BASE = import.meta.env.VITE_APP_API_URL + "/batch";

export function getBatch(params: BatchQuery = {}): Promise<Batch[]> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "activityId",
    sortOrder: params.sortOrder ?? params.sortOrder ?? "ASC",
    search: params.search ?? params.batchName,
    batchName: params.batchName ?? undefined,
    coachFirstName: params.coachFirstName ?? undefined,
    facilityName: params.facilityName ?? undefined,
    courseName: params.courseName ?? undefined,
    courseId: params.courseId ?? undefined,
  });

  return request<Batch[]>(`${BATCH_BASE}${qs}`);
}

export function getBatchById(id: number): Promise<Response> {
  return request<Response>(`${BATCH_BASE}/${id}`);
}

export function createBatch(payload: Batch): Promise<Response> {
  return request<Response>(BATCH_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function editBatch(id: number, payload: Partial<Batch>): Promise<Response> {
  return request<Response>(`${BATCH_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteBatch(id: number): Promise<Response> {
  return request<Response>(`${BATCH_BASE}/${id}`, {
    method: "DELETE",
  });
}
