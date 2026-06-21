import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { User } from "@/types/user";
// Assuming getUserById exists in user.api.ts
import { getUserById } from "@/api/user.api";
import {
	User as UserIcon,
	Mail,
	Shield,
	Calendar,
	Key,
	Link,
	Clock
} from "lucide-react";
import type { FieldConfig } from "@/components/view-modal/types";
import type { Response } from "@/types/response";
import { Badge } from "@/components/ui/badge";

type Props = {
	isOpen: boolean;
	userId?: number;
	onClose: () => void;
};

const fields: FieldConfig<User>[] = [
	{ key: "userId", label: "User ID", icon: Key },
	{ key: "username", label: "Username", icon: UserIcon },
	{ key: "email", label: "Email Address", icon: Mail },
	{
		key: "role",
		label: "Role",
		icon: Shield,
		render: (v) => <Badge variant={v === 'admin' ? 'default' : 'secondary'} className="capitalize">{v as string}</Badge>
	},
	{ key: "memberId", label: "Linked Member ID", icon: Link, render: (v) => (v as string) || "N/A" },
	{
		key: "lastLogin",
		label: "Last Login Time",
		icon: Clock,
		render: (v) => (v ? new Date(v as string).toLocaleString() : "Never"),
	},
	{
		key: "createdAt",
		label: "Account Created",
		icon: Calendar,
		render: (v) => (v ? new Date(v as string).toLocaleDateString() : "-"),
	},
	{
		// Per-user access overrides ({ grants, revokes }) layered on the role.
		key: "access",
		label: "Access Overrides",
		icon: Key,
		render: (value) => {
			const access = value as
				| { grants?: string[]; revokes?: string[] }
				| undefined;
			const grants = access?.grants ?? [];
			const revokes = access?.revokes ?? [];

			if (grants.length === 0 && revokes.length === 0) {
				return (
					<span className="text-muted-foreground text-sm">
						No overrides — access follows the role.
					</span>
				);
			}

			return (
				<div className="flex flex-col gap-2 mt-1">
					{grants.length > 0 && (
						<div className="flex items-center gap-2 text-sm flex-wrap">
							<span className="font-semibold text-blue-600">Granted:</span>
							{grants.map((g, idx) => (
								<Badge key={idx} variant="outline" className="text-xs">
									{g}
								</Badge>
							))}
						</div>
					)}
					{revokes.length > 0 && (
						<div className="flex items-center gap-2 text-sm flex-wrap">
							<span className="font-semibold text-rose-600">Revoked:</span>
							{revokes.map((g, idx) => (
								<Badge key={idx} variant="outline" className="text-xs">
									{g}
								</Badge>
							))}
						</div>
					)}
				</div>
			);
		},
	},
];

export default function UserViewModal({ isOpen, userId, onClose }: Props) {
	const fetchFn = useCallback(
		async (id?: number | string) => {
			const useId = id ?? userId;
			if (!useId) throw new Error("User ID missing");

			const res: Response<User> = await getUserById(Number(useId));
			// The backend now decrypts access, so res.data.access is JSON array
			return res?.data;
		},
		[userId]
	);

	return (
		<ViewModal<User>
			isOpen={isOpen}
			onClose={onClose}
			itemId={Number(userId)}
			fetchFn={fetchFn as any}
			fields={fields}
			title="View User Details"
			layout="grid" // Uses a grid layout, with 'access' spanning full width
		/>
	);
}