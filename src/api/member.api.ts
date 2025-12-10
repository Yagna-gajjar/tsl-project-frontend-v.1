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

export function getMembers(params: MembersQuery = {}): Promise<Response<Member[]>> {
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

	return request<Response<Member[]>>(`${MEMBER_BASE}${qs}`)
}

export function getMemberById(id: number): Promise<Response<Member>> {
	return request<Response<Member>>(`${MEMBER_BASE}/${id}`)
}

export function createMember(payload: Member): Promise<Response<Member>> {
	return request<Response<Member>>(MEMBER_BASE, {
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

export function deleteMember(id: number): Promise<Response<Member>> {
	return request<Response<Member>>(`${MEMBER_BASE}/${id}`, {
		method: 'DELETE'
	})
}

export async function saveUrlToMember(formData: FormData): Promise<Response> {
	try {
		console.log(formData, " formData");
		const res = await fetch(`${MEMBER_BASE}/avatar`, {
			method: "POST",
			body: formData,
		});

		const data = await res.json();
		console.log(data, "api.ts no code");
		return data;
	} catch (error) {
		console.error("Upload failed:", error);
		return {
			success: false,
			message: "Failed to upload image",
			data: null,
			pagination: {
				limit: 10,
				page: 1,
				total: 0
			}
		};
	}
}

export async function deleteAvatar(memberId: number, avatar: string): Promise<Response<Member>> {
	try {
		const response = await fetch(MEMBER_BASE + "/remove", {
			method: "POST",
			body: JSON.stringify({
				memberId: memberId,
				avatar: avatar
			}),
			headers: {
				"Content-Type": "application/json"
			}
		})
			.then((res) => res.json());

		return response;
	}
	catch {
		return {
			success: false,
			message: "Failed to save Image in user.",
			data: null,
			pagination: {
				limit: 10,
				page: 1,
				total: 0
			}
		}
	}
}