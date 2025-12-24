import type { Account } from "@/types/account";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface AccountQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  accountName?: string;
  entityId?: number;
  entityType?: string;
  accountType?: string;
}

const ACCOUNT_BASE = import.meta.env.VITE_APP_API_URL + "/account";

export function getAccounts(
  params: AccountQuery = {}
): Promise<Response<Account[]>> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "accountId",
    sortOrder: params.sortOrder ?? "ASC",
    search: params.search ?? params.accountName,
    accountName: params.accountName ?? undefined,
    entityId: params.entityId ?? undefined,
    entityType: params.entityType ?? undefined,
    accountType: params.accountType ?? undefined,
  });

  return request<Response<Account[]>>(`${ACCOUNT_BASE}${qs}`);
}

export function getAccountById(id: number): Promise<Response<Account>> {
  return request<Response<Account>>(`${ACCOUNT_BASE}/${id}`);
}

export function createAccount(
  payload: Omit<Account, "accountId" | "createdAt" | "updatedAt">
): Promise<Response<Account>> {
  return request<Response<Account>>(ACCOUNT_BASE, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAccount(
  id: number,
  payload: Partial<Account>
): Promise<Response<Account>> {
  return request<Response<Account>>(`${ACCOUNT_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAccount(id: number): Promise<Response<Account>> {
  return request<Response<Account>>(`${ACCOUNT_BASE}/${id}`, {
    method: "DELETE",
  });
}
