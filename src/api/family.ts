import type { FamilyType, FamilyTypeFormData } from '@/types/familyType'
import type { FamilyResponse, FamilyFormData } from '@/types/family'
import type { TeamCategory } from '@/types/teamCategory'
import type { IdentityType } from '@/types/identityType'

const BASE_URL = import.meta.env.VITE_APP_API_URL + '/family'

// Helper function
async function request<T>(url: string, options?: RequestInit): Promise<T> {
	try {
		const res = await fetch(url, {
			headers: { 'Content-Type': 'application/json' },
			...options,
		})

		const data = (await res.json()) as T
		return data
	} catch (error: any) {
		return {
			success: false,
			message: error.message || 'Request failed',
			data: null,
		} as T
	}
}

// GET: All families
export function getFamilies(): Promise<FamilyResponse> {
	return request<FamilyResponse>(BASE_URL)
}

// GET: Family by ID
export function getFamilyById(id: number): Promise<FamilyResponse> {
	return request<FamilyResponse>(`${BASE_URL}/${id}`)
}

// POST: Create family
export function createFamily(payload: FamilyFormData): Promise<FamilyResponse> {
	return request<FamilyResponse>(BASE_URL, {
		method: 'POST',
		body: JSON.stringify(payload),
	})
}

// PUT: Update family
export function updateFamily(
	id: number,
	payload: Partial<FamilyFormData>
): Promise<FamilyResponse> {
	return request<FamilyResponse>(`${BASE_URL}/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload),
	})
}

// DELETE: Delete family
export function deleteFamily(id: number): Promise<FamilyResponse> {
	return request<FamilyResponse>(`${BASE_URL}/${id}`, {
		method: 'DELETE',
	})
}

// POST: Create family type
export function createFamilyType(payload: FamilyTypeFormData): Promise<FamilyType> {
	return request<FamilyType>(import.meta.env.VITE_APP_API_URL + '/family-type', {
		method: 'POST',
		body: JSON.stringify(payload),
	})
}

// PUT: update family type
export function editFamilyType(id: number,payload: Partial<FamilyTypeFormData>): Promise<FamilyType> {
	return request<FamilyType>(import.meta.env.VITE_APP_API_URL + '/family-type/' + id, {
		method: 'PUT',
		body: JSON.stringify(payload),
	})
}

//GET Dropdown data for familyTypes
export function getFamilyTypes(): Promise<FamilyType> {
	return request<FamilyType>(import.meta.env.VITE_APP_API_URL + '/family-type')
}

// DELETE: delete familyTypes data
export function deleteFamilyTypes(id: number): Promise<FamilyType> {
	return request<FamilyType>(import.meta.env.VITE_APP_API_URL + '/family-type/' + id, {
		method: 'DELETE'
	})
}

// POST: Create team category
export function createTeamCategory(payload: TeamCategory): Promise<TeamCategory> {
	return request<TeamCategory>(import.meta.env.VITE_APP_API_URL + '/team-category', {
		method: 'POST',
		body: JSON.stringify(payload),
	})
}

// PUT: update family type
export function editTeamCategory(id: number,payload: Partial<TeamCategory>): Promise<TeamCategory> {
	return request<TeamCategory>(import.meta.env.VITE_APP_API_URL + '/team-category/' + id, {
		method: 'PUT',
		body: JSON.stringify(payload),
	})
}

// DELETE: delete familyTypes data
export function deleteTeamCategory(id: number): Promise<TeamCategory> {
	return request<TeamCategory>(import.meta.env.VITE_APP_API_URL + '/team-category/' + id, {
		method: 'DELETE'
	})
}

//GET data for teamCategories
export function getTeamCategories(): Promise<TeamCategory> {
	return request<TeamCategory>(import.meta.env.VITE_APP_API_URL + '/team-category')
}

//GET Dropdown data for identityTypes
export function getIdentityTypesByCategoryAndFamily(teamCategoryId: number | null, familyTypeId: number): Promise<IdentityType[]> {
	return request<IdentityType[]>(import.meta.env.VITE_APP_API_URL + '/identity-type/bycategoryandfamily?familyTypeId=' + familyTypeId + '&teamCategoryId=' + (teamCategoryId ?? null))
}

// GET: data for identityTypes
export function getidentityTypes(): Promise<IdentityType> {
	return request<IdentityType>(import.meta.env.VITE_APP_API_URL + '/identity-type')
}


// POST: Create team category
export function createIdentityType(payload: IdentityType): Promise<IdentityType> {
	return request<IdentityType>(import.meta.env.VITE_APP_API_URL + '/identity-type', {
		method: 'POST',
		body: JSON.stringify(payload),
	})
}

// PUT: update family type
export function editIdentityType(id: number,payload: Partial<IdentityType>): Promise<IdentityType> {
	return request<IdentityType>(import.meta.env.VITE_APP_API_URL + '/identity-type/' + id, {
		method: 'PUT',
		body: JSON.stringify(payload),
	})
}

// DELETE: delete familyTypes data
export function deleteIdentityType(id: number): Promise<IdentityType> {
	return request<IdentityType>(import.meta.env.VITE_APP_API_URL + '/identity-type/' + id, {
		method: 'DELETE'
	})
}
