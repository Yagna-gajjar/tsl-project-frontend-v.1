import type { Response } from "@/types/response";
import { request, toQueryString } from "./helper";
import type { Authority } from "@/types/authority";

const AUTHORITY_BASE = import.meta.env.VITE_APP_API_URL + "/authority";

export interface AuthorityQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  memberId?: number;
  accountId?: number;
}

interface changeauthority {
  oldMemberId: number;
  newMemberId: number;
  accountId: number;
  linkDate: Date | string;
}

export function changeAuthority(
  payload: Partial<changeauthority>
): Promise<Response<Authority[]>> {
  return request<Response<Authority[]>>(`${AUTHORITY_BASE}/change-authority`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAuthorities(
  params: AuthorityQuery = {}
): Promise<Response<Authority[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "authorityId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search,
    memberId: params.memberId,
    accountId: params.accountId,
  });

  return request<Response<Authority[]>>(`${AUTHORITY_BASE}${qs}`);
}

export function getAuthorityById(id: number): Promise<Response<Authority>> {
  return request<Response<Authority>>(`${AUTHORITY_BASE}/${id}`);
}

export function createAuthority(
  payload: Omit<Authority, "authorityId">
): Promise<Response<Authority>> {
  return request<Response<Authority>>(AUTHORITY_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAuthority(
  id: number,
  payload: Partial<Authority>
): Promise<Response<Authority>> {
  return request<Response<Authority>>(`${AUTHORITY_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAuthority(id: number): Promise<Response<void>> {
  return request<Response<void>>(`${AUTHORITY_BASE}/${id}`, {
    method: "DELETE",
  });
}
