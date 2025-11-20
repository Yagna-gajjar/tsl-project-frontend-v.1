
import type { Family } from '@/types/family'
import { request, toQueryString, type SortOrder } from './helper';
import type { Response } from '@/types/response';

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
}

const FAMILY_BASE = import.meta.env.VITE_APP_API_URL + '/family'

export function getFamilies(params: FamiliesQuery = {}): Promise<Response> {
	const qs = toQueryString({
		page: params.page ?? 1,
		limit: params.limit ?? 10,
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
		preferredLanguage: params.preferredLanguage
	});

	return request<Response>(`${FAMILY_BASE}${qs}`);
}

export function getFamilyById(id: number): Promise<Response> {
	return request<Response>(`${FAMILY_BASE}/${id}`)
}

export function createFamily(payload: Family): Promise<Response> {
	return request<Response>(FAMILY_BASE, {
		method: 'POST',
		body: JSON.stringify(payload),
	})
}

export function updateFamily(
	id: number,
	payload: Partial<Family>
): Promise<Response> {
	return request<Response>(`${FAMILY_BASE}/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload),
	})
}

export function deleteFamily(id: number): Promise<Family> {
	return request<Family>(`${FAMILY_BASE}/${id}`, {
		method: 'DELETE',
	})
}