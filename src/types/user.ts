export interface User {
	userId?: number,
	username: string,
	email: string,
	password: string,
	confirmPassword: string,
	role:string,
	craetedAt?: Date,
	updatedAt?: Date,
	lastLogin?: Date
}