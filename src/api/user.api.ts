import type { User } from "@/types/user";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface UserQuery {
	page?: number;
	limit?: number;
	search?: string;
	role?: string;
	memberId?: number;
	sortBy?: string;
	sortOrder?: SortOrder;
}

export interface LoginPayload {
	usernameOrEmail: string;
	password: string;
}

export interface LoginResponseData extends Response {
	token: string;
	user: User;
}

const USER_BASE = import.meta.env.VITE_APP_API_URL + "/user";


export function getUsers(params: UserQuery = {}): Promise<Response<User[]>> {
	const qs = toQueryString({
		page: params.page ?? 1,
		limit: params.limit ?? 10,
		sortBy: params.sortBy ?? "userId", // Changed from areaId to userId
		sortOrder: params.sortOrder ?? "ASC",
		search: params.search,
		role: params.role,
		memberId: params.memberId
	});

	return request<Response<User[]>>(`${USER_BASE}${qs}`);
}


export function getUserById(id: number): Promise<Response<User>> {
	return request<Response<User>>(`${USER_BASE}/${id}`);
}

export function signup(payload: User): Promise<Response<User>> {
	return request<Response<User>>(`${USER_BASE}/signup`, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export interface ChangePasswordPayload {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

export function changePassword(
	payload: ChangePasswordPayload
): Promise<Response> {
	return request<Response>(`${USER_BASE}/change-password`, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export function login(payload: LoginPayload): Promise<LoginResponseData> {
	return request<LoginResponseData>(`${USER_BASE}/login`, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export function getDatabases(token: string): Promise<Response<string[]>> {
	return request<Response<string[]>>(`${USER_BASE}/databases`, {
		method: "GET",
	}, token);
}

export function validateToken(): Promise<LoginResponseData> {
	return request<LoginResponseData>(`${USER_BASE}/validate`, {
		method: "GET",
	});
}

export function updateUser(
	id: number,
	payload: Partial<User>
): Promise<Response<User>> {
	return request<Response<User>>(`${USER_BASE}/${id}`, {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}


export function deleteUser(id: number): Promise<Response<User>> {
	return request<Response<User>>(`${USER_BASE}/${id}`, {
		method: "DELETE",
	});
}