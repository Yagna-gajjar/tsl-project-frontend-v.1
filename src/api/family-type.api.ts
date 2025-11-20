import type { FamilyType } from '@/types/familyType'
import { request, toQueryString, type SortOrder } from './helper';
import type { Response } from '@/types/response';

export interface FamilyTypesQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sorting?: SortOrder; // your backend sometimes uses 'sorting'
    search?: string;
    name?: string;
}

const FAMILY_TYPE_BASE = import.meta.env.VITE_APP_API_URL + '/family-type';

export function getFamilyTypes(params: FamilyTypesQuery = {}): Promise<FamilyType[]> {
    const qs = toQueryString({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        sortBy: params.sortBy ?? 'familyTypeId',
        sorting: params.sorting ?? (params.sorting ?? 'ASC'),
        search: params.search ?? params.name
    });

    return request<FamilyType[]>(`${FAMILY_TYPE_BASE}${qs}`);
}

export function getFamilyTypesById(id: number): Promise<Response> {
    return request<Response>(`${FAMILY_TYPE_BASE}/${id}`)
}

export function createFamilyType(payload: FamilyType): Promise<Response> {
    return request<Response>(FAMILY_TYPE_BASE, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export function editFamilyType(id: number, payload: Partial<FamilyType>): Promise<Response> {
    return request<Response>(`${FAMILY_TYPE_BASE}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    })
}

export function deleteFamilyTypes(id: number): Promise<Response> {
    return request<Response>(`${FAMILY_TYPE_BASE}/${id}`, {
        method: 'DELETE'
    })
}