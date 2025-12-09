import type { InOutLog } from "@/types/inout";
import { request, toQueryString } from "./helper";
import type { Response } from "@/types/response";

export interface InOutQuery {
	page?: number;
	limit?: number;
	userId?: number;
	isActive?: boolean;
	username?: string;
	role?: string;
	email?: string;
}

const INOUT_BASE = import.meta.env.VITE_APP_API_URL + "/inout";

export function checkIn(userId: number): Promise<Response<InOutLog>> {
	return request<Response<InOutLog>>(`${INOUT_BASE}/check-in`, {
		method: "POST",
		body: JSON.stringify({ userId }),
	});
}

export function checkOut(userId: number): Promise<Response<InOutLog>> {
	return request<Response<InOutLog>>(`${INOUT_BASE}/check-out`, {
		method: "POST",
		body: JSON.stringify({ userId }),
	});
}

export function isUserActive(userId: number): Promise<Response> {
	return request<Response<Response<InOutLog>>>(`${INOUT_BASE}/isactive/${userId}`);
}

export function getLogs(params: InOutQuery = {}): Promise<Response<InOutLog[]>> {
	const qs = toQueryString({
		page: params.page ?? 1,
		limit: params.limit ?? 20,
		userId: params.userId,
		isActive: params.isActive,
		role: params.role,
		email: params.email,
		username: params.username
	});

	return request<Response<InOutLog[]>>(`${INOUT_BASE}${qs}`);
}

export function getActiveUsers(): Promise<Response<InOutLog[]>> {
	return request<Response<InOutLog[]>>(`${INOUT_BASE}/active`);
}

export function getAttendanceByDate(date: string): Promise<Response<any>> {
	return request<Response<any>>(`${INOUT_BASE}/attendance?date=${date}`);

}