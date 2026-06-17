import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/authContext";
import { resourceForPath, userCan } from "@/config/permissions";

// Redirects a logged-in user away from any route their role cannot read.
// It does not handle authentication (the AuthProvider already does that) —
// while the session is still validating, it renders children untouched.
export default function RouteGuard({ children }: { children: React.ReactNode }) {
	const { user, isLoading } = useAuth();
	const location = useLocation();

	if (isLoading || !user) return <>{children}</>;

	const resource = resourceForPath(location.pathname);
	if (resource && !userCan(user, resource, "read")) {
		return <Navigate to="/dashboard" replace />;
	}

	return <>{children}</>;
}
