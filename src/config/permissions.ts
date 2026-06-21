// Frontend mirror of the backend role-based access model
// (tsl-project-backend/lib/permissions.js). Keep the two in sync.
//
// This drives UI gating only — the backend is the real enforcement point.

export type Action = "read" | "create" | "update" | "delete";
export type Role = "superadmin" | "admin" | "staff";

export const ACTIONS: Action[] = ["read", "create", "update", "delete"];

export const RESOURCES = [
	"Member",
	"Account",
	"Authority",
	"Enrollment",
	"Batch",
	"Course",
	"Membership",
	"Facility",
	"CoachSkill",
	"CoachAssignment",
	"Attendance",
	"Appointment",
	"Discount",
	"Finance",
	"Settings",
	"User",
] as const;

export type Resource = (typeof RESOURCES)[number];

// Resources a "staff" member may NOT touch at all.
const STAFF_DENIED: Resource[] = ["Settings", "User"];

type PermissionMap = Partial<Record<Resource, Action[]>>;

function buildAccess(resources: readonly Resource[]): PermissionMap {
	const map: PermissionMap = {};
	for (const r of resources) map[r] = [...ACTIONS];
	return map;
}

export const ROLE_PERMISSIONS: Record<Role, "*" | PermissionMap> = {
	superadmin: "*", // full access
	admin: "*", // full access (will be narrowed later)
	staff: buildAccess(RESOURCES.filter((r) => !STAFF_DENIED.includes(r))),
};

export function roleCan(
	role: string | undefined | null,
	resource: Resource,
	action: Action = "read"
): boolean {
	if (!role) return false;
	const perms = ROLE_PERMISSIONS[role as Role];
	if (!perms) return false;
	if (perms === "*") return true;
	const allowed = perms[resource];
	return !!allowed && allowed.includes(action);
}

// Effective permission map for a role with wildcards expanded.
// Used by the access-management screen to render the matrix.
export function permissionsForRole(role: string | undefined | null): PermissionMap {
	if (!role) return {};
	const perms = ROLE_PERMISSIONS[role as Role];
	if (perms === "*") return buildAccess(RESOURCES);
	return perms || {};
}

// ---------------------------------------------------------------------------
// Per-user overrides: extra grants / revokes layered on top of the role.
// Mirror of tsl-project-backend/lib/permissions.js.
// ---------------------------------------------------------------------------

export interface UserOverrides {
	grants: Resource[];
	revokes: Resource[];
}

export function normalizeOverrides(raw: unknown): UserOverrides {
	if (raw && typeof raw === "object" && !Array.isArray(raw)) {
		const o = raw as { grants?: unknown; revokes?: unknown };
		return {
			grants: Array.isArray(o.grants) ? (o.grants as Resource[]) : [],
			revokes: Array.isArray(o.revokes) ? (o.revokes as Resource[]) : [],
		};
	}
	return { grants: [], revokes: [] };
}

// Resources granted purely by the role ("*" for full-access roles).
export function roleResourceSet(
	role: string | undefined | null
): Set<Resource> | "*" {
	if (!role) return new Set();
	const perms = ROLE_PERMISSIONS[role as Role];
	if (!perms) return new Set();
	if (perms === "*") return "*";
	return new Set(Object.keys(perms) as Resource[]);
}

// Effective resources = role defaults ∪ grants − revokes ("*" stays "*").
export function effectiveResourceSet(
	role: string | undefined | null,
	overrides: unknown
): Set<Resource> | "*" {
	const base = roleResourceSet(role);
	if (base === "*") return "*";
	const ov = normalizeOverrides(overrides);
	const set = new Set(base);
	ov.grants.forEach((r) => set.add(r));
	ov.revokes.forEach((r) => set.delete(r));
	return set;
}

export interface AccessUser {
	role?: string;
	access?: unknown;
}

// Can a user (role + overrides) reach a resource? Resource-level model:
// a reachable module grants all actions, so `action` is accepted for API
// symmetry but not yet differentiated.
export function userCan(
	user: AccessUser | null | undefined,
	resource: Resource,
	_action: Action = "read"
): boolean {
	if (!user) return false;
	const eff = effectiveResourceSet(user.role, user.access);
	if (eff === "*") return true;
	return eff.has(resource);
}

// Maps a route path to the resource that guards it (longest prefix wins).
const ROUTE_RESOURCE: { prefix: string; resource: Resource }[] = [
	{ prefix: "/staff-management/access-details", resource: "User" },
	{ prefix: "/staff-management/user-access", resource: "User" },
	{ prefix: "/staff-management/coach-assignment", resource: "CoachAssignment" },
	{ prefix: "/staff-management/coach-skills", resource: "CoachSkill" },
	{ prefix: "/staff-management/attendance", resource: "Attendance" },
	{ prefix: "/account/authority", resource: "Authority" },
	{ prefix: "/account", resource: "Account" },
	{ prefix: "/enrollment-dashboard", resource: "Enrollment" },
	{ prefix: "/enrollment", resource: "Enrollment" },
	{ prefix: "/bookings", resource: "Appointment" },
	{ prefix: "/course", resource: "Course" },
	{ prefix: "/batches", resource: "Batch" },
	{ prefix: "/batch", resource: "Batch" },
	{ prefix: "/discount", resource: "Discount" },
	{ prefix: "/infrastructure-configurations", resource: "Facility" },
	{ prefix: "/infrastructure-Configurations", resource: "Facility" },
	{ prefix: "/finance", resource: "Finance" },
	{ prefix: "/membership", resource: "Membership" },
	{ prefix: "/setting", resource: "Settings" },
];
ROUTE_RESOURCE.sort((a, b) => b.prefix.length - a.prefix.length);

export function resourceForPath(pathname: string): Resource | null {
	for (const { prefix, resource } of ROUTE_RESOURCE) {
		if (pathname === prefix || pathname.startsWith(prefix + "/")) return resource;
	}
	return null;
}
