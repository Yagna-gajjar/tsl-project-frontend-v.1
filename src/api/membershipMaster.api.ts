import type { MembershipMaster } from "@/types/membershipMaster";
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
  entityType?: string;
  suspensionDate?: boolean;
  enumCase?: string;
}

const MEMBERSHIP_BASE = import.meta.env.VITE_APP_API_URL + "/membership-master";

export function getMembershipMasters(
  params: MembershipMasterQuery = {}
): Promise<Response<MembershipMaster[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "membershipMasterId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? undefined,
    entityType: params.entityType ?? undefined,
    membershipType: params.membershipType ?? undefined,
    suspensionDate: params.suspensionDate ?? false,
    guardianEntry:
      typeof params.guardianEntry === "boolean"
        ? String(params.guardianEntry)
        : undefined,
    guestAllowed:
      typeof params.guestAllowed === "boolean"
        ? String(params.guestAllowed)
        : undefined,
    clubAccess:
      typeof params.clubAccess === "boolean"
        ? String(params.clubAccess)
        : undefined,
    enumCase: params.enumCase,
  });

  return request<Response<MembershipMaster[]>>(`${MEMBERSHIP_BASE}${qs}`);
}

export function getMembershipMasterById(id: number): Promise<Response<MembershipMaster>> {
  return request<Response<MembershipMaster>>(`${MEMBERSHIP_BASE}/${id}`);
}

export function createMembershipMaster(
  payload: Omit<MembershipMaster, "membershipMasterId" | "createdAt" | "updatedAt">
): Promise<MembershipMaster> {

  return request<MembershipMaster>(MEMBERSHIP_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMembershipMaster(
  id: number,
  payload: Partial<Omit<MembershipMaster, "membershipMasterId" | "createdAt" | "updatedAt">>
): Promise<MembershipMaster> {
  return request<MembershipMaster>(`${MEMBERSHIP_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteMembershipMaster(id: number): Promise<MembershipMaster> {
  return request<MembershipMaster>(`${MEMBERSHIP_BASE}/${id}`, {
    method: "DELETE",
  });
}
