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

// Define the structure of encrypted access JSON if not already in types
interface AccessPermission {
	resource: string;
	actions: string[];
}

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
		// Custom Renderer for the JSON Access Field
		key: "access",
		label: "Access Permissions",
		icon: Key,
		render: (value) => {
			const permissions = value as AccessPermission[] | undefined;
			if (!permissions || permissions.length === 0) {
				return <span className="text-muted-foreground text-sm">No specific permissions assigned.</span>;
			}

			return (
				<div className="flex flex-col gap-2 mt-1">
					{permissions.map((perm, idx) => (
						<div key={idx} className="flex items-center text-sm border rounded-md p-2 bg-muted/40">
							<span className="font-semibold capitalize mr-2">{perm.resource}:</span>
							<div className="flex gap-1 flex-wrap">
								{perm.actions.map((action, actionIdx) => (
									<Badge key={actionIdx} variant="outline" className="text-xs capitalize">
										{action}
									</Badge>
								))}
							</div>
						</div>
					))}
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