import type { Course } from "@/types/course";
import { request, toQueryString, type SortOrder } from "./helper";

export interface CourseQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  academyId?: number;
  activityId?: number;
  courseName?: string;
  status?: string;
}

const COURSE_BASE = import.meta.env.VITE_APP_API_URL + "/course";

export function getCourses(params: CourseQuery = {}): Promise<Course[]> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "courseId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? undefined,
    academyId: params.academyId ?? undefined,
    activityId: params.activityId ?? undefined,
    courseName: params.courseName ?? undefined,
    status: params.status ?? undefined,
  });

  return request<Course[]>(`${COURSE_BASE}${qs}`);
}

export function getCourseByAcademy(academyId: number): Promise<Course[]> {
  return request<Course[]>(`${COURSE_BASE}?academyId=${academyId}`);
}

export function getCourseById(id: number): Promise<Course> {
  return request<Course>(`${COURSE_BASE}/${id}`);
}

export function createCourse(
  payload: Omit<Course, "courseId" | "createdAt" | "updatedAt">
): Promise<Course> {
  return request<Course>(COURSE_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCourse(
  id: number,
  payload: Partial<Omit<Course, "courseId" | "createdAt" | "updatedAt">>
): Promise<Course> {
  return request<Course>(`${COURSE_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteCourse(id: number): Promise<Course> {
  return request<Course>(`${COURSE_BASE}/${id}`, {
    method: "DELETE",
  });
}
