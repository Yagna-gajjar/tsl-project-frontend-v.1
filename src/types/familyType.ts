export interface FamilyType {
	familyTypeId: number;
	familyTypeName: string;
	prefix?: string;
	maxMembers: number;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface FamilyTypeResponse {
	success: boolean
	message: string
	data: FamilyType | FamilyType[] | null
}

export type FamilyTypeFormData = Omit<FamilyType, 'familyTypeId' | 'createdAt' | 'updatedAt'>