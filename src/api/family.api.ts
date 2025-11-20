
import type { Family } from '@/types/family'
import { request, toQueryString, type SortOrder } from './helper';

export interface FamiliesQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
  familyName?: string;
  profession?: string;
  email?: string;
  status?: string;
  identityTypeId?: number | string;
  familyTypeId?: number | string;
  teamCategoryId?: number | string;
  preferredLanguage?: string;
  createdFrom?: string; // ISO date
  createdTo?: string;   // ISO date
}

const FAMILY_BASE = import.meta.env.VITE_APP_API_URL + '/family'

// GET
export function getFamilies(params: FamiliesQuery = {}): Promise<Family> {
	// backend expects sortBy and sortOrder or sortBy & sortOrder names — match your backend query names
	const qs = toQueryString({
	  page: params.page ?? 1,
	  limit: params.limit ?? 20,
	  sortBy: params.sortBy ?? 'familyId',
	  sortOrder: params.sortOrder ?? 'ASC',
	  search: params.search,
	  familyName: params.familyName,
	  profession: params.profession,
	  email: params.email,
	  status: params.status,
	  identityTypeId: params.identityTypeId,
	  familyTypeId: params.familyTypeId,
	  teamCategoryId: params.teamCategoryId,
	  preferredLanguage: params.preferredLanguage,
	  createdFrom: params.createdFrom,
	  createdTo: params.createdTo
	});
  
	return request<Family>(`${FAMILY_BASE}${qs}`);
}  

// GET BY ID
export function getFamilyById(id: number): Promise<Family> {
	return request<Family>(`${FAMILY_BASE}/${id}`)
}

// POST
export function createFamily(payload: Family): Promise<Family> {
	return request<Family>(FAMILY_BASE, {
		method: 'POST',
		body: JSON.stringify(payload),
	})
}

// PUT
export function updateFamily(
	id: number,
	payload: Partial<Family>
): Promise<Family> {
	return request<Family>(`${FAMILY_BASE}/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload),
	})
}

// DELETE
export function deleteFamily(id: number): Promise<Family> {
	return request<Family>(`${FAMILY_BASE}/${id}`, {
		method: 'DELETE',
	})
}