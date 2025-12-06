import type { Payment } from "@/types/payment";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface PaymentQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sorting?: SortOrder;
  search?: string;
  paymentType?: string;
  paymentMode?: string;
  academyId?: number;
  memberId?: number;
  enrollmentId?: number;
}

const PAYMENT_BASE = import.meta.env.VITE_APP_API_URL + "/payment";

export function getPayments(params: PaymentQuery = {}): Promise<Payment[]> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "paymentId",
    sorting: params.sorting ?? "ASC",
    search: params.search ?? undefined,
    paymentType: params.paymentType ?? undefined,
    paymentMode: params.paymentMode ?? undefined,
    academyId: params.academyId ?? undefined,
    memberId: params.memberId ?? undefined,
    enrollmentId: params.enrollmentId ?? undefined,
  });

  return request<Payment[]>(`${PAYMENT_BASE}${qs}`);
}

export function getPaymentById(id: number): Promise<Response> {
  return request<Response>(`${PAYMENT_BASE}/${id}`);
}

export function createPayment(
  payload: Omit<Payment, "paymentId" | "createdAt">
): Promise<Response> {
  return request<Response>(PAYMENT_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePayment(
  id: number,
  payload: Partial<Payment>
): Promise<Response> {
  return request<Response>(`${PAYMENT_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deletePayment(id: number): Promise<Response> {
  return request<Response>(`${PAYMENT_BASE}/${id}`, {
    method: "DELETE",
  });
}
