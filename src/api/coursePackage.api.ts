import type { CoursePackage } from "@/types/coursePackage";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface CoursePackageQuery {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: SortOrder;
	search?: string;
	linkType?: string;
	activityType?: string;
	courseId?: number;
	courseName?: string;
}

const COURSE_PACKAGE_BASE =
	import.meta.env.VITE_APP_API_URL + "/course-package";

export function getCoursePackages(
	params: CoursePackageQuery = {}
): Promise<Response<CoursePackage[]>> {
	const qs = toQueryString({
		page: params.page ?? 1,
		limit: params.limit ?? 10,
		sortBy: params.sortBy ?? "coursePackageId",
		sortOrder: params.sortOrder ?? "ASC",
		search: params.search ?? params.linkType,
		linkType: params.linkType ?? undefined,
		activityType: params.activityType ?? undefined,
		courseId: params.courseId ?? undefined,
		courseName: params.courseName ?? undefined,
	});

	return request<Response<CoursePackage[]>>(`${COURSE_PACKAGE_BASE}${qs}`);
}

export function getCoursePackageById(
	id: number
): Promise<Response<CoursePackage>> {
	return request<Response<CoursePackage>>(`${COURSE_PACKAGE_BASE}/${id}`);
}

export function createCoursePackage(
	payload: Omit<
		CoursePackage,
		"coursePackageId" | "createdAt" | "updatedAt"
	>
): Promise<Response<CoursePackage>> {
	return request<Response<CoursePackage>>(COURSE_PACKAGE_BASE, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export function updateCoursePackage(
	id: number,
	payload: Partial<CoursePackage>
): Promise<Response<CoursePackage>> {
	return request<Response<CoursePackage>>(`${COURSE_PACKAGE_BASE}/${id}`, {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export function deleteCoursePackage(
	id: number
): Promise<Response> {
	return request<Response>(`${COURSE_PACKAGE_BASE}/${id}`, {
		method: "DELETE",
	});
}
