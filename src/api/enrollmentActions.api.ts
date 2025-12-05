import { request } from "./helper";

const API_BASE =
  (import.meta.env.VITE_APP_API_URL ?? "http://localhost:9705/api");

interface BatchMemberRequest {
  batchMemberId: number;
  batchId: number;
  memberId: number;
  enrollmentId?: number | null;
  status: string;
  reason?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function getBatchMemberRequests(): Promise<BatchMemberRequest[]> {
  return request<BatchMemberRequest[]>(`${API_BASE}/batch-member/request`);
}

interface BatchMemberRequestForm {
  batchId: number;
  memberId: number;
  enrollmentId?: number | null;
  status: string;
  reason?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function createBatchMemberRequests(payload: BatchMemberRequestForm): Promise<Response> {
  return request<Response>(`${API_BASE}/batch-member/request`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

interface AcceptRequest {
  oldBatchId: number
  newBatchId: number;
  oldBatchEndDate: string;
  memberId: number;
} 

export function AcceptRequest(payload: AcceptRequest): Promise<Response> {
  return request<Response>(`${API_BASE}/batch-member/accept`, {
          method: 'POST',
          body: JSON.stringify(payload),
      })
}

interface updateBatchMember {
  status: string,
  reason: any
}

export function updateBatchMember(id: number, payload: updateBatchMember): Promise<Response> {
   return request<Response>(`${API_BASE}/batch-member/${id}`, {
     method: "PUT",
     body: JSON.stringify(payload),
   });
}
