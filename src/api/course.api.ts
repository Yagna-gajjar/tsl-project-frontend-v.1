import type { Course } from "@/types/course";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

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
  entityId?: number;
  classification?: string;
  suspenspedCourse?: boolean;
}

const COURSE_BASE = import.meta.env.VITE_APP_API_URL + "/course";

export function getCourses(
  params: CourseQuery = {}
): Promise<Response<Course[]>> {
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
    entityId: params.entityId ?? undefined,
    classification: params.classification ?? undefined,
    suspenspedCourse: params.suspenspedCourse ?? undefined,
  });

  return request<Response<Course[]>>(`${COURSE_BASE}${qs}`);
}

export function getCourseByAcademy(
  academyId: number
): Promise<Response<Course[]>> {
  return request<Response<Course[]>>(`${COURSE_BASE}?academyId=${academyId}`);
}

export function getCourseById(id: number): Promise<Response<Course>> {
  return request<Response<Course>>(`${COURSE_BASE}/${id}`);
}

export function createCourse(
  payload: Omit<Course, "courseId" | "createdAt" | "updatedAt">
): Promise<Response<Course>> {
  return request<Response<Course>>(COURSE_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createFullCourse(payload: any): Promise<Response<any>> {
  return request<Response<any>>(`${COURSE_BASE}/full`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCourse(
  id: number,
  payload: Partial<Omit<Course, "courseId" | "createdAt" | "updatedAt">>
): Promise<
  Response<Partial<Omit<Course, "courseId" | "createdAt" | "updatedAt">>>
> {
  return request<
    Response<Partial<Omit<Course, "courseId" | "createdAt" | "updatedAt">>>
  >(`${COURSE_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteCourse(id: number): Promise<Response<Course>> {
  return request<Response<Course>>(`${COURSE_BASE}/${id}`, {
    method: "DELETE",
  });
}
