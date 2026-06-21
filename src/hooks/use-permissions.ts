import { useAuth } from "@/contexts/authContext";
import { userCan, type Action, type Resource } from "@/config/permissions";

// Convenience hook for UI gating: `const { can } = usePermissions()`.
// `can` reflects the logged-in user's effective access (role + per-user overrides).
export function usePermissions() {
	const { user } = useAuth();

	return {
		role: user?.role,
		can: (resource: Resource, action: Action = "read") =>
			userCan(user, resource, action),
	};
}
