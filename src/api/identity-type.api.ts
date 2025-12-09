import type { IdentityType } from "@/types/identityType";
import { request, toQueryString, type SortOrder } from "./helper";
import type { Response } from "@/types/response";

export interface IdentityTypesQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: SortOrder;
  search?: string;
  familyTypeId?: number | string;
  teamCategoryId?: number | string | 'null';
  identityTypeName?: string | 'null';
  discount?: number | 0;
}

const IDENTITY_TYPE_BASE = import.meta.env.VITE_APP_API_URL + '/identity-type';

export function getIdentityTypes(params: IdentityTypesQuery = {}): Promise<Response<IdentityType[]>> {

  const qs = toQueryString({
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? 'identityTypeId',
    order: params.order ?? 'ASC',
    search: params.search,
    familyTypeId: params.familyTypeId,
    teamCategoryId: params.teamCategoryId,
    identityTypeName: params.identityTypeName,
    discount: params.discount
  });

  return request<Response<IdentityType[]>>(`${IDENTITY_TYPE_BASE}${qs}`);
}

export function getIdentityTypesByCategoryAndFamily(teamCategoryId: number | null, familyTypeId: number): Promise<Response> {
  return request<Response>(import.meta.env.VITE_APP_API_URL + '/identity-type/bycategoryandfamily' + toQueryString({
    familyTypeId,
    teamCategoryId: teamCategoryId === null ? 'null' : teamCategoryId
  }));
}

export function getIdentityTypesByID(id: number): Promise<Response<IdentityType>> {
  return request<Response<IdentityType>>(`${IDENTITY_TYPE_BASE}/${id}`)
}

export function createIdentityTypes(payload: IdentityType): Promise<Response<IdentityType>> {
  return request < Response<IdentityType>>(IDENTITY_TYPE_BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function editIdentityTypes(id: number, payload: Partial<IdentityType>): Promise<Response<IdentityType>> {
  return request < Response<IdentityType>>(`${IDENTITY_TYPE_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteIdentityTypes(id: number): Promise<Response> {
  return request<Response>(`${IDENTITY_TYPE_BASE}/${id}`, {
    method: 'DELETE'
  })
}