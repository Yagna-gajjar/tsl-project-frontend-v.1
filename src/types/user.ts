export interface AccessPermission {
	resource: string;
	actions: ("read" | "create" | "update" | "delete")[];
}

// Per-user access overrides layered on top of the role: lists of resource
// names to additionally grant or to revoke.
export interface UserAccess {
	grants: string[];
	revokes: string[];
}

export interface User {
	userId?: number;
	username: string;
	email: string;
	password?: string;
	confirmPassword?: string;

	role: "admin" | "staff" | "superadmin" | string;
	memberId?: number;

	access?: UserAccess;

	lastLogin?: Date | string;
	createdAt?: Date | string;
	updatedAt?: Date | string;
}