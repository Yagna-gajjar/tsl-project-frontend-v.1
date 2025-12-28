export interface AccessPermission {
	resource: string;
	actions: ("read" | "create" | "update" | "delete")[];
}

export interface User {
	userId?: number;
	username: string;
	email: string;
	password?: string;
	confirmPassword?: string;

	role: "admin" | "staff" | "superadmin" | string;
	memberId?: number;

	access: AccessPermission[];

	lastLogin?: Date | string;
	createdAt?: Date | string;
	updatedAt?: Date | string;
}