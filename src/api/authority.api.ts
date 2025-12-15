import type { Response } from "@/types/response";
import { request, toQueryString } from "./helper";
import type { Authority } from "@/types/authority";

const AUTHORITY_BASE = import.meta.env.VITE_APP_API_URL + "/authority";

export interface AuthorityQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  search?: string;
  accountId?: number;
  active?: boolean;
}

export function getAuthorities(
  params: AuthorityQuery = {}
): Promise<Response<Authority[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 1000,
    sortBy: params.sortBy ?? "activityId",
    accountId: params.accountId,
    active: params.active,
  });

  return request<Response<Authority[]>>(`${AUTHORITY_BASE}${qs}`);
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