// membership.api.ts
import type { membershipMaster } from "@/types/memberShipMaster";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface MembershipMasterQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  membershipType?: string;
  guardianEntry?: boolean;
  guestAllowed?: boolean;
  clubAccess?: boolean;
}

const MEMBERSHIP_BASE = import.meta.env.VITE_APP_API_URL + "/membership-master";

export function getMembershipMasters(
  params: MembershipMasterQuery = {}
): Promise<membershipMaster[]> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "membershipMasterId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? undefined,
    membershipType: params.membershipType ?? undefined,
    guardianEntry:
      typeof params.guardianEntry === "boolean" ? String(params.guardianEntry) : undefined,
    guestAllowed:
      typeof params.guestAllowed === "boolean" ? String(params.guestAllowed) : undefined,
    clubAccess:
      typeof params.clubAccess === "boolean" ? String(params.clubAccess) : undefined,
  });

  return request<membershipMaster[]>(`${MEMBERSHIP_BASE}${qs}`);
}

export function getMembershipMasterById(id: number): Promise<Response> {
  return request<Response>(`${MEMBERSHIP_BASE}/${id}`);
}

export function createMembershipMaster(
  payload: Omit<membershipMaster, "membershipMasterId" | "createdAt" | "updatedAt">
): Promise<membershipMaster> {
  
  return request<membershipMaster>(MEMBERSHIP_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMembershipMaster(
  id: number,
  payload: Partial<Omit<membershipMaster, "membershipMasterId" | "createdAt" | "updatedAt">>
): Promise<membershipMaster> {
  return request<membershipMaster>(`${MEMBERSHIP_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteMembershipMaster(id: number): Promise<membershipMaster> {
  return request<membershipMaster>(`${MEMBERSHIP_BASE}/${id}`, {
    method: "DELETE",
  });
}
