import type { IdentityType } from "@/types/identityType";
import { request, toQueryString, type SortOrder } from "./helper";

export interface IdentityTypesQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: SortOrder;
  search?: string;
  familyTypeId?: number | string;
  teamCategoryId?: number | string | 'null';
}

const IDENTITY_TYPE_BASE = import.meta.env.VITE_APP_API_URL + '/identity-type';

// GET
export function getIdentityTypes(params: IdentityTypesQuery = {}): Promise<IdentityType[]> {
  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? 'identityTypeId',
    order: params.order ?? 'ASC',
    search: params.search,
    familyTypeId: params.familyTypeId,
    teamCategoryId: params.teamCategoryId
  });

  return request<IdentityType[]>(`${IDENTITY_TYPE_BASE}${qs}`);
}

// SPECIAL GET
export function getIdentityTypesByCategoryAndFamily(teamCategoryId: number | null, familyTypeId: number): Promise<IdentityType[]> {
  return request<IdentityType[]>(import.meta.env.VITE_APP_API_URL + '/identity-type/bycategoryandfamily' + toQueryString({
    familyTypeId,
    teamCategoryId: teamCategoryId === null ? 'null' : teamCategoryId
  }));
}

// GET BY ID
export function gettIdentityTypesByID(id: number): Promise<IdentityType> {
  return request<IdentityType>(`${IDENTITY_TYPE_BASE}/${id}`)
}

// POST
export function createtIdentityTypes(payload: IdentityType): Promise<IdentityType> {
  return request<IdentityType>(IDENTITY_TYPE_BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// PUT
export function edittIdentityTypes(id: number, payload: Partial<IdentityType>): Promise<IdentityType> {
  return request<IdentityType>(`${IDENTITY_TYPE_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

// DELETE
export function deletetIdentityTypes(id: number): Promise<IdentityType> {
  return request<IdentityType>(`${IDENTITY_TYPE_BASE}/${id}`, {
    method: 'DELETE'
  })
}