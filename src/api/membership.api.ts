import type { membership } from "@/types/membership";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface MembershipQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  membershipMasterId?: number;
  billingEntityOfFamily?: string;
  suspensionDate?: boolean;
  accountId?: number;
  status?: string;
}

const MEMBERSHIP_BASE = import.meta.env.VITE_APP_API_URL + "/membership";

export function getMemberships(
  params: MembershipQuery = {}
): Promise<Response<membership[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "membershipId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? undefined,
    membershipMasterId: params.membershipMasterId ?? undefined,
    accountId: params.accountId ?? undefined,
    status: params.status ?? undefined,
    billingEntityOfFamily: params.billingEntityOfFamily ?? undefined,
    suspensionDate: true,
  });

  console.log(qs, " shqddd");

  return request<Response<membership[]>>(`${MEMBERSHIP_BASE}${qs}`);
}

export function getMembershipById(id: number): Promise<Response<membership>> {
  return request<Response<membership>>(`${MEMBERSHIP_BASE}/${id}`);
}

export function createMembership(
  payload: Omit<membership, "membershipId" | "createdAt" | "updatedAt">
): Promise<membership> {
  return request<membership>(MEMBERSHIP_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMembership(
  id: number,
  payload: Partial<Omit<membership, "membershipId" | "createdAt" | "updatedAt">>
): Promise<membership> {
  return request<membership>(`${MEMBERSHIP_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteMembership(id: number): Promise<membership> {
  return request<membership>(`${MEMBERSHIP_BASE}/${id}`, {
    method: "DELETE",
  });
}
