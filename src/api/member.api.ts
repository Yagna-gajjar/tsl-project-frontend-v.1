import type { Member } from '@/types/member'
import { request, toQueryString, type SortOrder } from './helper'
import type { Response } from '@/types/response'

export interface MembersQuery {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: SortOrder;
	search?: string;

	memberFirstName?: string;
	memberLastName?: string;
	gender?: string;
	age?: number | string;
	mobile?: string;
	email?: string;
	city?: string;
	status?: string;

	familyId?: number | string;
	familyTypeId?: number | string;
	identityTypeId?: number | string;
	teamCategoryId?: number | string;

	createdFrom?: string;
	createdTo?: string;
	maratialStatus?: string;
	contactNumber?: string;
	address?: string;
	idProofNumber?: string;
	idProofType?: string;
	includeCasual?: boolean;
}

const MEMBER_BASE = import.meta.env.VITE_APP_API_URL + "/member";

export function getMembers(
	params: MembersQuery = {}
): Promise<Response<Member[]>> {
	const qs = toQueryString({
		page: params.page ?? 1,
		limit: params.limit ?? 10,
		sortBy: params.sortBy ?? "memberId",
		sortOrder: params.sortOrder ?? "ASC",
		search: params.search || undefined,

		memberFirstName: params.memberFirstName,
		memberLastName: params.memberLastName,
		gender: params.gender,
		mobile: params.mobile,
		status: params.status,
		city: params.city,
		maratialStatus: params.maratialStatus,
		contactNumber: params.contactNumber,
		address: params.address,
		idProofNumber: params.idProofNumber,
		idProofType: params.idProofType,
		includeCasual: params.includeCasual,
	});

	return request<Response<Member[]>>(`${MEMBER_BASE}${qs}`);
}

export function getMemberById(id: number): Promise<Response<Member>> {
	return request<Response<Member>>(`${MEMBER_BASE}/${id}`)
}

export function getMembershipsByMember(id: number): Promise<Response<any>> {
	return request<Response<any>>(`${MEMBER_BASE}/memberships/${id}`)
}

export function checkDuplicateEmail(email: string): Promise<Response<boolean>> {
	return request<Response<boolean>>(`${MEMBER_BASE}/duplicate-email`, {
		method: 'POST',
		body: JSON.stringify({ email })
	})
}

export function checkDuplicateContact(contact: string): Promise<Response<boolean>> {
	return request<Response<boolean>>(`${MEMBER_BASE}/duplicate-contact`, {
		method: 'POST',
		body: JSON.stringify({ contactNumber: contact })
	})
}

export function checkDuplicateIdProof(
	idProofType: string,
	idProofNumber: string
): Promise<Response<boolean>> {
	return request<Response<boolean>>(`${MEMBER_BASE}/duplicate-id`, {
		method: 'POST',
		body: JSON.stringify({ idProofType, idProofNumber })
	})
}

export function checkDuplicateMemberByName(
	memberFirstName: string,
	memberLastName: string
): Promise<Response<boolean>> {
	return request<Response<boolean>>(`${MEMBER_BASE}/duplicate-name`, {
		method: 'POST',
		body: JSON.stringify({ memberFirstName, memberLastName })
	})
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
): Promise<Response<Member>> {
	return request<Response<Member>>(`${MEMBER_BASE}/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload)
	})
}

export function deleteMember(id: number): Promise<Response<Member>> {
	return request<Response<Member>>(`${MEMBER_BASE}/${id}`, {
		method: 'DELETE'
	})
}

function dbHeaders(): Record<string, string> {
	const token = localStorage.getItem("token");
	const selectedDb = localStorage.getItem("selected_db_name");
	return {
		...(token ? { authorization: `Bearer ${token}` } : {}),
		...(selectedDb ? { "x-db-name": selectedDb } : {}),
	};
}

export async function saveUrlToMember(formData: FormData): Promise<Response> {
	try {
		const res = await fetch(`${MEMBER_BASE}/avatar`, {
			method: "POST",
			body: formData,
			headers: dbHeaders(),
		});

		const data = await res.json();
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
				"Content-Type": "application/json",
				...dbHeaders(),
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