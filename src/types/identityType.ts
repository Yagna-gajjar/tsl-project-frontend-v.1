export interface IdentityType {
	identityTypeId?: number;
	familyTypeId: number;
	teamCategoryId?: number;
	identityTypeName: string;
	discount: number;
	createdAt?: Date;
	updatedAt?: Date;

	familyTypeName?: string;
	prefix?: string;
	maxMembers?: string;
}
