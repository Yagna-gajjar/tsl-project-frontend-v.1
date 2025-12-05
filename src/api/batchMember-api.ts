import { request } from "./helper";
import type { Response } from "@/types/response";

export interface BatchMember {
  enrollmentId: number;
  batchId: number;
  memberId: number;
  status: string;
  memberFirstName?: string;
  batchName: string;
  startTime: string;
  endTime: string;
  coachId: number;
  coachName: string;
  startDate: Date;
  endDate: Date;
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