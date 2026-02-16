import type { CourseRate } from "@/types/courseRate";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface CourseRateQuery {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: SortOrder;
	search?: string;
	courseId?: number;
	entityType?: string;
	membershipMasterId: number;
	courseName?: string;
}

const RATE_BASE = import.meta.env.VITE_APP_API_URL + "/course-rate";

export function getCourseRates(
	params: CourseRateQuery = {}
): Promise<Response<CourseRate[]>> {
	const qs = toQueryString({
		page: params.page ?? 1,
		limit: params.limit ?? 10,
		sortBy: params.sortBy ?? "courseRateId",
		sortOrder: params.sortOrder ?? "ASC",
		search: params.search ?? undefined,
		courseId: params.courseId ?? undefined,
		membershipMasterId: params.membershipMasterId ?? undefined,
		entityType: params.entityType ?? undefined,
		courseName: params.courseName ?? undefined
	});

	return request<Response<CourseRate[]>>(`${RATE_BASE}${qs}`);
}

export function getCourseRateById(id: number): Promise<Response<CourseRate>> {
	return request<Response<CourseRate>>(`${RATE_BASE}/${id}`);
}

export function createCourseRate(
	payload: Omit<CourseRate, "courseRateId" | "createdAt" | "updatedAt">
): Promise<Response<CourseRate>> {
	return request<Response<CourseRate>>(RATE_BASE, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export function updateCourseRate(
	id: number,
	payload: Partial<Omit<CourseRate, "courseRateId" | "createdAt" | "updatedAt">>
): Promise<Response<Partial<CourseRate>>> {
	return request<Response<Partial<CourseRate>>>(`${RATE_BASE}/${id}`, {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export function deleteCourseRate(id: number): Promise<Response<CourseRate>> {
	return request<Response<CourseRate>>(`${RATE_BASE}/${id}`, {
		method: "DELETE",
	});
}