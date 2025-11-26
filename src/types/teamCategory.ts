export interface TeamCategory {
	teamCategoryId?: number;
	categoryName: string;
	shortName?: string;
	access?: 'active' | 'inactive' | 'block';
	details?: string;
	createdAt?: Date;
	updatedAt?: Date;
}