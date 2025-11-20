export interface Address {
	addressId: number;
	line1: string;
	line2?: string;
	city: string;
	state: string;
	pinCode?: string;
	country?: string;
	createdAt?: Date;
	updatedAt?: Date;
}
