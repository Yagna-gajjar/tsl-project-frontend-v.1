import type { FamilyType } from '@/types/familyType'
import { request, toQueryString, type SortOrder } from './helper';

export interface FamilyTypesQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sorting?: SortOrder; // your backend sometimes uses 'sorting'
  search?: string;
  name?: string;
}

const FAMILY_TYPE_BASE = import.meta.env.VITE_APP_API_URL + '/family-type';

// GET
export function getFamilyTypes(params: FamilyTypesQuery = {}): Promise<FamilyType[]> {
    const qs = toQueryString({
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      sortBy: params.sortBy ?? 'familyTypeId',
      // some controllers use 'sorting' instead of 'sortOrder'
      sorting: params.sorting ?? (params.sorting ?? 'ASC'),
      search: params.search ?? params.name
    });
  
    return request<FamilyType[]>(`${FAMILY_TYPE_BASE}${qs}`);
}

// GET BY ID
export function getFamilyTypesById(id: number): Promise<FamilyType> {
    return request<FamilyType>(`${FAMILY_TYPE_BASE}/${id}`)
}

// POST
export function createFamilyType(payload: FamilyType): Promise<FamilyType> {
    return request<FamilyType>(FAMILY_TYPE_BASE, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

// PUT
export function editFamilyType(id: number,payload: Partial<FamilyType>): Promise<FamilyType> {
    return request<FamilyType>(`${FAMILY_TYPE_BASE}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    })
}
 
// DELETE
export function deleteFamilyTypes(id: number): Promise<FamilyType> {
    return request<FamilyType>(`${FAMILY_TYPE_BASE}/${id}`, {
        method: 'DELETE'
    })
}