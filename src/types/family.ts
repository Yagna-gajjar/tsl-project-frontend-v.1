export interface Family {
	familyId?: number
	familyName: string
	familyTypeId: number
	teamCategoryId: number | null
	identityTypeId: number
	profession: string
	professionDetails: string
	designation: string
	emergencyContact: string
	remarks?: string
	email: string
	status: 'active' | 'inactive' | 'block'
	preferredLanguage: string
	createdAt?: string
	updatedAt?: string
	familyTypeName?: string
	teamCategoryName?: string
}

export interface FamilyResponse {
	success: boolean
	message: string
	data: Family | Family[] | null
}