import { request } from "./helper";
import type { Response } from "@/types/response";

export interface BatchMember {
	enrollmentId: number;
	batchId: number;
	memberId: number;
	status: string;
}

const BATCH_MEMBER_BASE = import.meta.env.VITE_APP_API_URL + "/batch-member";

export function changeBatch(
	payload: BatchMember
): Promise<Response> {
	return request<Response>(`${BATCH_MEMBER_BASE}/change-batch`, {
		method: "POST",
		body: JSON.stringify(payload),
	});
} ``