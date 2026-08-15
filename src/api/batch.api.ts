import type { Batch } from "@/types/batch";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";
import type { BatchMember } from "@/types/batchMember";

export interface BatchQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  batchName?: string;
  coachName?: string;
  facilityName?: string;
  activityName?: string;
  courseName?: string | null;
  courseId?: number;
  batchType?: string;
  academyId?: number;
  status?: string;
  entityName?: string;
  admissionCriteria?: string;
  activityId?: number;
  entityId?: number;
  startTime?: Date | string;
  endTime?: Date | string;
  daysPattern?: string;
}

const BATCH_BASE = import.meta.env.VITE_APP_API_URL + "/batch";

export interface ReassignBatchMembersPayload {
  fromBatchId: number;
  toBatchId: number;
  batchMemberIds: number[];
}

export function getBatch(params: BatchQuery = {}): Promise<Response<Batch[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "activityId",
    sortOrder: params.sortOrder ?? params.sortOrder ?? "ASC",
    search: params.search ?? params.batchName,
    batchName: params.batchName ?? undefined,
    coachName: params.coachName ?? undefined,
    facilityName: params.facilityName ?? undefined,
    courseName: params.courseName ?? undefined,
    courseId: params.courseId ?? undefined,
    batchType: params.batchType ?? undefined,
    academyId: params.academyId ?? undefined,
    status: params.status ?? undefined,
    activityName: params.activityName ?? undefined,
    entityName: params.entityName ?? undefined,
    admissionCriteria: params.admissionCriteria ?? undefined,
    entityId: params.entityId ?? undefined,
    activityId: params.activityId ?? undefined,
    startTime: params.startTime ?? undefined,
    endTime: params.endTime ?? undefined,
    daysPattern: params.daysPattern ?? undefined,
  });

  return request<Response<Batch[]>>(`${BATCH_BASE}${qs}`);
}

export function getBatchById(id: number): Promise<Response<Batch>> {
  return request<Response<Batch>>(`${BATCH_BASE}/${id}`);
}

export function createBatch(payload: Batch): Promise<Response<Batch>> {
  return request<Response<Batch>>(BATCH_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function editBatch(
  id: number,
  payload: Batch,
): Promise<Response<Batch>> {
  return request<Response<Batch>>(`${BATCH_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteBatch(id: number, newBatchId: number): Promise<Response> {
  return request<Response>(`${BATCH_BASE}/${id}`, {
    method: "DELETE",
    body: JSON.stringify({
      newBatchId,
    }),
  });
}
export function reassignRequiredBatch(id: number): Promise<
  Response<{
    required: boolean;
    count: number;
    batchMembers: BatchMember[];
  }>
> {
  return request<
    Response<{
      required: boolean;
      count: number;
      batchMembers: BatchMember[];
    }>
  >(`${BATCH_BASE}/reassign-required-batch/${id}`, {
    method: "GET",
  });
}
