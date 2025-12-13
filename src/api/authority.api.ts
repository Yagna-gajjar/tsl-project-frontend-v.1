import type { Response } from "@/types/response";
import { request, toQueryString } from "./helper";

const AUTHORITY_BASE = import.meta.env.VITE_APP_API_URL + "/authority";

export interface AuthorityQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sorting?: SortOrder;
  search?: string;
    accountId?: number;
    active?: boolean;
}

export function getAuthorities(
  params: AuthorityQuery = {}
) {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 1000,
    sortBy: params.sortBy ?? "activityId",
      sorting: params.sorting ?? params.sorting ?? "ASC",
      accountId: params.accountId,
      active: params.active
  });

  return request(`${AUTHORITY_BASE}${qs}`);
}

interface changeauthority {
  oldMemberId: number;
  newMemberId: number;
  accountId: number;
  linkDate: Date | string;
}

export function changeAuthority(
  payload: Partial<changeauthority>
): Promise<Response<changeauthority>> {
  return request<Response<changeauthority>>(`${AUTHORITY_BASE}/change-authority`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}