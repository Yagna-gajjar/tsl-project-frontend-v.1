import type { CourseShare } from "@/types/courseShare";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface CourseShareQuery {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: SortOrder;
	search?: string;
	shareType?: string;
	academyId?: number;
	academyName?: string;
}

const COURSE_SHARE_BASE =
	import.meta.env.VITE_APP_API_URL + "/course-share";

export function getCourseShares(
	params: CourseShareQuery = {}
): Promise<Response<CourseShare[]>> {
	const qs = toQueryString({
		page: params.page ?? 1,
		limit: params.limit ?? 10,
		sortBy: params.sortBy ?? "courseShareId",
		sortOrder: params.sortOrder ?? "ASC",
		search: params.search ?? params.shareType,
		shareType: params.shareType ?? undefined,
		academyId: params.academyId ?? undefined,
		academyName: params.academyName ?? undefined,
	});

	return request<Response<CourseShare[]>>(`${COURSE_SHARE_BASE}${qs}`);
}

export function getCourseShareById(
	id: number
): Promise<Response<CourseShare>> {
	return request<Response<CourseShare>>(`${COURSE_SHARE_BASE}/${id}`);
}

export function createCourseShare(
	payload: Omit<CourseShare, "courseShareId" | "createdAt" | "updatedAt">
): Promise<Response<CourseShare>> {
	return request<Response<CourseShare>>(COURSE_SHARE_BASE, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export function updateCourseShare(
	id: number,
	payload: Partial<CourseShare>
): Promise<Response<CourseShare>> {
	return request<Response<CourseShare>>(`${COURSE_SHARE_BASE}/${id}`, {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export function deleteCourseShare(
	id: number
): Promise<Response> {
	return request<Response>(`${COURSE_SHARE_BASE}/${id}`, {
		method: "DELETE",
	});
}
