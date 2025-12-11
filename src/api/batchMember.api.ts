import type { BatchMember } from "@/types/batchMember";
import { request, toQueryString } from "./helper";
import type { Response } from "@/types/response";

export interface BatchMemberQuery {
  enrollmentId?: number;
}

const BATCH_MEMBER_BASE = import.meta.env.VITE_APP_API_URL + "/batch-member";

export function getBatchMember(
  params: BatchMemberQuery = {}
): Promise<Response<BatchMember[]>> {
  const qs = toQueryString({
    enrollmentId: params.enrollmentId ?? undefined,
  });

  return request<Response<BatchMember[]>>(`${BATCH_MEMBER_BASE}${qs}`);
}

export function changeBatch(payload: BatchMember): Promise<Response> {
  return request<Response>(`${BATCH_MEMBER_BASE}/change-batch`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAttendance(batchId: number): Promise<Response<BatchMember>> {
  return request<Response<BatchMember>>(
    `${BATCH_MEMBER_BASE}/attendance/${batchId}`,
    {
      method: "GET",
    }
  );
}

export function shiftMembers(
  oldBatchId: number,
  newBatchId: number,
  memberIds: number[]
): Promise<Response> {
  return request<Response>(`${BATCH_MEMBER_BASE}/shift`, {
    method: "POST",
    body: JSON.stringify({
      oldBatchId,
      newBatchId,
      memberIds,
    }),
  });
}

export function makeAppointment(
  payload: BatchMember
): Promise<Response<BatchMember>> {
  return request<Response<BatchMember>>(
    `${BATCH_MEMBER_BASE}/makeAppointments`,
    {
      method: "Post",
      body: JSON.stringify(payload),
    }
  );
}
