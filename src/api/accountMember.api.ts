import { request, toQueryString } from "./helper";
import type { Response } from "@/types/response";
import type { AccountMember } from "@/types/accountMember";

const BASE_URL = import.meta.env.VITE_APP_API_URL + "/account-member";

export interface AccountMemberQuery {
  page?: number;
  limit?: number;
  search?: string;
  memberId?: number;
  accountId?: number;
  entityType?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  // --- New Filter Params ---
  accountName?: string;
  memberFirstName?: string;
  memberLastName?: string;
  status?: string;
}

/**
 * Fetches account members with optional pagination, sorting, and filtering.
 * The `toQueryString` helper will automatically convert the object into 
 * ?page=1&limit=10&accountName=... etc.
 */
export function getAccountMembers(
  params: AccountMemberQuery = {}
): Promise<Response<AccountMember[]>> {
  return request<Response<AccountMember[]>>(
    `${BASE_URL}${toQueryString(params)}`,
    { method: "GET" }
  );
}
export function getAccountsWithAllMembersByMemberId(memberId: string): Promise<Response<AccountMember[]>> {
  return request<Response<AccountMember[]>>(
    `${BASE_URL}/by-member/${memberId}`,
    { method: "GET" }
  );
}

export function getAccountMemberById(
  id: number
): Promise<Response<AccountMember>> {
  return request<Response<AccountMember>>(`${BASE_URL}/${id}`, {
    method: "GET",
  });
}

export function isMemberAlreadyLinked(
  id: number
): Promise<Response<AccountMember>> {
  return request<Response<AccountMember>>(`${BASE_URL}/linked/${id}`, {
    method: "GET",
  });
}

export function createAccountMember(
  payload: Omit<AccountMember, "accountMemberId" | "createdAt" | "updatedAt">
): Promise<Response<AccountMember>> {
  return request<Response<AccountMember>>(BASE_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function createAccountMemberWithMember(payload: AccountMember): Promise<Response<AccountMember>> {
  return request<Response<AccountMember>>(`${BASE_URL}/account-with-member`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function updateAccountMember(
  id: number,
  payload: Partial<AccountMember>
): Promise<Response<AccountMember>> {
  return request<Response<AccountMember>>(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAccountMember(
  id: number
): Promise<Response<AccountMember>> {
  return request<Response<AccountMember>>(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
}

export function bulkAccountMember(
  payload: Omit<AccountMember, "accountMemberId" | "createdAt" | "updatedAt">
): Promise<Response<AccountMember>> {
  return request<Response<AccountMember>>(`${BASE_URL}/bulk`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};