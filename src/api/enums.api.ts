import type { Enums } from '@/types/enums'
import { request, toQueryString, type SortOrder } from './helper';
import type { Response } from '@/types/response';

export interface EnumsQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sorting?: SortOrder;
    search?: string;
}

const ENUMS_BASE = import.meta.env.VITE_APP_API_URL + '/enum';

export function getAllEnums(params: EnumsQuery = {}): Promise<Enums[]> {
    const qs = toQueryString({
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        sortBy: params.sortBy ?? 'id',
        sorting: params.sorting ?? 'ASC',
        search: params.search,
    });

    return request<Enums[]>(`${ENUMS_BASE}${qs}`);
}

export function getEnumsByCategory(categoryName: string): Promise<Enums[]> {
    return request<Enums[]>(`${ENUMS_BASE}/${categoryName}`);
}

export function createEnum(payload: Enums): Promise<Response> {
    return request<Response>(ENUMS_BASE, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export function updateEnum(id: number, payload: Partial<Enums>): Promise<Response> {
    return request<Response>(`${ENUMS_BASE}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    })
}

export function deleteEnum(id: number): Promise<Response> {
    return request<Response>(`${ENUMS_BASE}/${id}`, {
        method: 'DELETE'
    })
}
