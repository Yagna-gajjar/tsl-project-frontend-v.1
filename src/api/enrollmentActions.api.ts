import type { Response } from "@/types/response";
import type { BatchMember } from "./batchMember-api";
import { request } from "./helper";
import type { Enrollment } from "@/types/enrollment";

const API_BASE =
  import.meta.env.VITE_APP_API_URL ?? "http://localhost:9705/api";

export function getBatchMemberRequests(): Promise<Response<BatchMember[]>> {
  return request<Response<BatchMember[]>>(`${API_BASE}/batch-member/request`);
}

export function createBatchMemberRequests(
  payload: BatchMember
): Promise<Response<BatchMember>> {
  return request<Response<BatchMember>>(`${API_BASE}/batch-member/request`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

interface AcceptRequest {
  oldBatchId: number;
  newBatchId: number;
  oldBatchEndDate: string;
  memberId: number;
}

export function AcceptRequest(
  payload: AcceptRequest
): Promise<Response<BatchMember>> {
  return request<Response<BatchMember>>(`${API_BASE}/batch-member/accept`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

interface updateBatchMember {
  status: string;
  reason: string;
}

export function updateBatchMember(
  id: number,
  payload: updateBatchMember
): Promise<Response<BatchMember>> {
  return request<Response<BatchMember>>(`${API_BASE}/batch-member/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function enrollmentChange(
  payload: Enrollment
): Promise<Response<BatchMember>> {
  return request<Response<BatchMember>>(`${API_BASE}/enrollment-change/demo`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}