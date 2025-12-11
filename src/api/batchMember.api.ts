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

interface appointment {
  batchId: number | null;
  memberId: number | null;
  enrollmentId: number | null;
  status: string | null;
  startDate: string | Date;
  endDate: string | Date;
  weekDays: number | null;
}

export function makeAppointment(
  payload: appointment
): Promise<Response<appointment>> {
  return request<Response<appointment>>(
    `${BATCH_MEMBER_BASE}/make-appointments`,
    {
      method: "Post",
      body: JSON.stringify({ appointments: payload }),
    }
  );
}
