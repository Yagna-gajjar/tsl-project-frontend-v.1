import type { Enrollment, EnrollmentData } from "@/types/enrollment";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface EnrollmentQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  academyId?: number;
  courseId?: number;
  memberId?: number;
  status?: string;
  memberFirstName?: string;
  billingAmount?: number;
  academyName?: string;
  courseName?: string;
  billingRate?: number;
  cndn?: number;
  enrollmentNo?: number;
}

const ENROLLMENT_BASE = import.meta.env.VITE_APP_API_URL + "/enrollment";

export function getEnrollments(
  params: EnrollmentQuery = {},
): Promise<Response<Enrollment[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "enrollmentId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? undefined,
    academyId: params.academyId ?? undefined,
    courseId: params.courseId ?? undefined,
    memberId: params.memberId ?? undefined,
    status: params.status ?? undefined,
    memberFirstName: params.memberFirstName ?? undefined,
    academyName: params.academyName ?? undefined,
    courseName: params.courseName ?? undefined,
    enrollmentNo: params.enrollmentNo ?? undefined,
  });

  return request<Response<Enrollment[]>>(`${ENROLLMENT_BASE}${qs}`);
}

export function getEnrollmentById(id: number): Promise<Response<Enrollment>> {
  return request<Response<Enrollment>>(`${ENROLLMENT_BASE}/${id}`);
}

export function loadEnrollmentById(id: number): Promise<Response<any>> {
  return request<Response<any>>(`${ENROLLMENT_BASE}/load/${id}`);
}

export function createEnrollment(
  payload: Omit<Enrollment, "enrollmentId" | "createdAt" | "updatedAt">,
): Promise<Response<Enrollment>> {
  return request<Response<Enrollment>>(ENROLLMENT_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function changeEnrollment(payload: {
  existingEnrollmentId: string;
  existingEnrollmentNo: string;
  newVersion: Partial<EnrollmentData>;
  newEnrollment: Partial<EnrollmentData>;
}): Promise<Response<Enrollment>> {
  return request<Response<Enrollment>>(`${ENROLLMENT_BASE}/change-enrollment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateEnrollment(
  id: number,
  payload: Partial<
    Omit<Enrollment, "enrollmentId" | "createdAt" | "updatedAt">
  >,
): Promise<Response<Enrollment>> {
  return request<Response<Enrollment>>(`${ENROLLMENT_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteEnrollment(id: number): Promise<Response<Enrollment>> {
  return request<Response<Enrollment>>(`${ENROLLMENT_BASE}/${id}`, {
    method: "DELETE",
  });
}
