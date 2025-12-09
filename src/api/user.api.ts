import type { User } from "@/types/user";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface UserQuery {
	page?: number;
	limit?: number;
	username?: string;
	sortBy?: string;
	sortOrder?: SortOrder;
}

export interface LoginPayload {
	usernameOrEmail: string;
	password: string;
}

export interface SignupPayload {
	username: string;
	email: string;
	password: string;
	role?: "staff" | "admin" | "superadmin";
}

export interface LoginResponseData {
	token: string;
	user: User;
	success: boolean;
	message: string
}

const USER_BASE = import.meta.env.VITE_APP_API_URL + "/user";

export function getUser(params: UserQuery = {}): Promise<User[]> {
	const qs = toQueryString({
		page: params.page ?? 1,
		limit: params.limit ?? 10,
		sortBy: params.sortBy ?? "areaId",
		sorting: params.sortOrder ?? "ASC",
		search: params.username ?? params.username,
	});

	return request<User[]>(`${USER_BASE}${qs}`);
}

export function createUser(
	payload: Omit<User, "userId" | "createdAt" | "updatedAt" | "lastLogin">
): Promise<Response<User>> {
	return request<Response<User>>(USER_BASE, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export function updateUser(
	id: number,
	payload: Partial<User>
): Promise<Response> {
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

export function login(payload: LoginPayload): Promise<LoginResponseData> {
	console.log(payload, " payload");
	return request<LoginResponseData>(`${USER_BASE}/login`, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export function signup(payload: SignupPayload): Promise<Response<User>> {
	return request<Response<User>>(`${USER_BASE}/signup`, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}