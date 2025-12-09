import { request } from "./helper";
import type { Response } from "@/types/response";

export interface BatchMember {
  batchMemberId:number
  enrollmentId: number;
  batchId: number;
  memberId: number;
  status: string;
  courseId: number;
  memberFirstName?: string;
  batchName: string;
  startTime: string;
  endTime: string;
  coachId: number;
  coachName: string;
  startDate: Date | string;
  endDate: Date | string;
  oldEnollmentEndDate: Date;
  newStartDate: Date;
  members: {
    batchMemberId: number;
    memberId: number;
    memberName: string;
  }[];
}

const BATCH_MEMBER_BASE = import.meta.env.VITE_APP_API_URL + "/batch-member";

export function changeBatch(
  payload: BatchMember
): Promise<Response> {
  return request<Response>(`${BATCH_MEMBER_BASE}/change-batch`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAttendance(
  batchId: number
): Promise<Response> {
  return request<Response>(`${BATCH_MEMBER_BASE}/attendance/${batchId}`, {
    method: "GET",
  });
}

export function shiftMembers(
  oldBatchId: number, newBatchId: number, memberIds: number[]
): Promise<Response> {
  return request<Response>(`${BATCH_MEMBER_BASE}/shift`, {
    method: "POST",
    body: JSON.stringify({
      oldBatchId,
      newBatchId,
      memberIds
    }),
  });
}