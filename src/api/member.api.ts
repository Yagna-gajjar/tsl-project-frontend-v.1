import type { Member } from '@/types/member'
import { request, toQueryString, type SortOrder } from './helper'
import type { Response } from '@/types/response'

export interface MembersQuery {
	page?: number
	limit?: number
	sortBy?: string
	sortOrder?: SortOrder
	search?: string

	memberFirstName?: string
	memberLastName?: string
	gender?: string
	age?: number | string
	mobile?: string
	email?: string
	city?: string
	status?: string

	familyId?: number | string
	familyTypeId?: number | string
	identityTypeId?: number | string
	teamCategoryId?: number | string

	createdFrom?: string
	createdTo?: string
}

const MEMBER_BASE = import.meta.env.VITE_APP_API_URL + '/member'

export function getMembers(params: MembersQuery = {}): Promise<Response> {
	const qs = toQueryString({
		page: params.page ?? 1,
		limit: params.limit ?? 10,
		sortBy: params.sortBy ?? 'memberId',
		sortOrder: params.sortOrder ?? 'ASC',
		search: params.search,

		memberFirstName: params.memberFirstName,
		memberLastName: params.memberLastName,
		gender: params.gender,
		mobile: params.mobile,
		status: params.status,
		city: params.city,

		familyId: params.familyId
	})

	return request<Response>(`${MEMBER_BASE}${qs}`)
}

export function getMemberById(id: number): Promise<Response> {
	return request<Response>(`${MEMBER_BASE}/${id}`)
}

export function createMember(payload: Member): Promise<Response> {
	return request<Response>(MEMBER_BASE, {
		method: 'POST',
		body: JSON.stringify(payload)
	})
}

export function updateMember(
	id: number,
	payload: Partial<Member>
): Promise<Response> {
	return request<Response>(`${MEMBER_BASE}/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload)
	})
}

export function deleteMember(id: number): Promise<Member> {
	return request<Member>(`${MEMBER_BASE}/${id}`, {
		method: 'DELETE'
	})
}
