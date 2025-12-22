import type { MembershipLink } from "@/types/membershipLink";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface MembershipLinkQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  membershipMasterId?: number;
  membershipId?: number;
  membershipType?: string;
  entityType?: string;
  entityId?: number;
  accountId?: number;
  hideDeLinked?: boolean;
}

const BASE = import.meta.env.VITE_APP_API_URL + "/membership-link";

export function getMembershipLinks(
  params: MembershipLinkQuery = {}
): Promise<Response<MembershipLink[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "membershipLinkId",
    sortOrder: params.sortOrder ?? "ASC",
    membershipMasterId: params.membershipMasterId,
    membershipId: params.membershipId,
    membershipType: params.membershipType,
    entityType: params.entityType,
    hideDeLinked: params.hideDeLinked,
    accountId: params.accountId,
    entityId: params.entityId,
  });

  return request<Response<MembershipLink[]>>(`${BASE}${qs}`);
}

export function getMembershipLinkById(
  id: number
): Promise<Response<MembershipLink>> {
  return request<Response<MembershipLink>>(`${BASE}/${id}`);
}

export function createMembershipLink(
  payload: Omit<MembershipLink, "membershipLinkId">
): Promise<Response<MembershipLink>> {
  return request<Response<MembershipLink>>(BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMembershipLink(
  id: number,
  payload: Partial<MembershipLink>
): Promise<Response<MembershipLink>> {
  return request<Response<MembershipLink>>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteMembershipLink(id: number): Promise<Response> {
  return request<Response>(`${BASE}/${id}`, {
    method: "DELETE",
  });
}
