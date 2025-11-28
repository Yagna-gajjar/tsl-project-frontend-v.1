import type { Discount } from "@/types/discount";
import { request, toQueryString, type SortOrder } from "./helper";

export interface DiscountQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  courseId?: number;
  status?: string;
  aboveUnits?: number;
  courseName?: string;
}

const DISCOUNT_BASE = import.meta.env.VITE_APP_API_URL + "/discount";

export function getDiscounts(params: DiscountQuery = {}): Promise<Discount[]> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "discountId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? undefined,
    courseId: params.courseId ?? undefined,
    status: params.status ?? undefined,
    courseName: params.courseName ?? undefined,
    aboveUnits: params.aboveUnits ?? undefined,
  });

  return request<Discount[]>(`${DISCOUNT_BASE}${qs}`);
}

export function getDiscountById(id: number): Promise<Discount> {
  return request<Discount>(`${DISCOUNT_BASE}/${id}`);
}

export function createDiscount(
  payload: Omit<Discount, "discountId" | "createdAt" | "updatedAt">
): Promise<Discount> {
  return request<Discount>(DISCOUNT_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDiscount(
  id: number,
  payload: Partial<Omit<Discount, "discountId" | "createdAt" | "updatedAt">>
): Promise<Discount> {
  return request<Discount>(`${DISCOUNT_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteDiscount(id: number): Promise<Discount> {
  return request<Discount>(`${DISCOUNT_BASE}/${id}`, {
    method: "DELETE",
  });
}
