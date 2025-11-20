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
	familyTypeName?: string
	teamCategoryName?: string
	identityTypeName?: string
	createdAt?: Date
	updatedAt?: Date
}

export interface FamilyResponse {
	success: boolean
	message: string
	data: Family | Family[] | null
}