export interface IdentityType {
	identityTypeId: number;
	familyTypeId: number;
	identityTypeName: string;
	teamCategoryId?: number;
	discount: number;
	createdAt?: Date;
	updatedAt?: Date;
}
