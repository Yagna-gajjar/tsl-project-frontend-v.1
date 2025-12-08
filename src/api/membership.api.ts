// membership.api.ts
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
  familyId?: number;
  status?: string;
}

const MEMBERSHIP_BASE = import.meta.env.VITE_APP_API_URL + "/membership";

export function getMemberships(
  params: MembershipQuery = {}
): Promise<membership[]> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "membershipId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? undefined,
    membershipMasterId: params.membershipMasterId ?? undefined,
    familyId: params.familyId ?? undefined,
    status: params.status ?? undefined,
  });

  return request<membership[]>(`${MEMBERSHIP_BASE}${qs}`);
}

export function getMembershipById(id: number): Promise<Response> {
  return request<Response>(`${MEMBERSHIP_BASE}/${id}`);
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
