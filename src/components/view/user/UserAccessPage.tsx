import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	ShieldCheck,
	User,
	Search,
	Save,
	ShieldAlert,
	ChevronRight,
	UserCog,
	Crown,
	Lock,
	AlertTriangle,
} from "lucide-react";
import { getUsers, updateUser } from "@/api/user.api";
import type { User as UserType, UserAccess } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	GRANTABLE_RESOURCES,
	roleResourceSet,
	effectiveResourceSet,
	normalizeOverrides,
	type Role,
	type Resource,
} from "@/config/permissions";

const ROLE_OPTIONS: {
	value: Role;
	label: string;
	description: string;
	icon: React.ElementType;
}[] = [
	{
		value: "staff",
		label: "Staff",
		description: "Limited baseline. Use the toggles below to fine-tune.",
		icon: User,
	},
	{
		value: "admin",
		label: "Admin",
		description: "Full access to every module.",
		icon: ShieldCheck,
	},
	{
		value: "superadmin",
		label: "Super Admin",
		description: "Full access, including users, roles and all databases.",
		icon: Crown,
	},
];

const RESOURCE_INFO: Record<Resource, string> = {
	Member: "Member profiles & records",
	Account: "Accounts & account members",
	Authority: "Account authority links",
	Enrollment: "Enrollments & changes",
	Batch: "Batches & batch members",
	Course: "Courses, packages, rates & shares",
	Membership: "Memberships & links",
	Facility: "Facilities, areas & allotments",
	CoachSkill: "Coach skills",
	CoachAssignment: "Coach assignments",
	Attendance: "Staff check-in / attendance",
	Appointment: "Bookings & appointments",
	Discount: "Discounts",
	Finance: "Transactions, billing & ledger",
	Settings: "System settings & lookups",
	User: "User & role management",
	Audit: "Audit trail (superadmin only)",
};

type EnabledMap = Record<Resource, boolean>;

// Working on/off state for a role + its saved overrides.
function computeEnabled(role: string, overrides: unknown): EnabledMap {
	const eff = effectiveResourceSet(role, overrides);
	const map = {} as EnabledMap;
	for (const r of GRANTABLE_RESOURCES) map[r] = eff === "*" ? true : eff.has(r);
	return map;
}

// Minimal override set (grants/revokes) implied by the toggles vs the role.
function computeOverrides(role: string, enabled: EnabledMap): UserAccess {
	const base = roleResourceSet(role);
	if (base === "*") return { grants: [], revokes: [] };
	const grants: string[] = [];
	const revokes: string[] = [];
	for (const r of GRANTABLE_RESOURCES) {
		const roleHas = base.has(r);
		if (enabled[r] && !roleHas) grants.push(r);
		if (!enabled[r] && roleHas) revokes.push(r);
	}
	return { grants, revokes };
}

function sortedEq(a: string[], b: string[]) {
	if (a.length !== b.length) return false;
	const sa = [...a].sort();
	const sb = [...b].sort();
	return sa.every((v, i) => v === sb[i]);
}

export default function UserAccessPage() {
	const [users, setUsers] = useState<UserType[]>([]);
	const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
	const [role, setRole] = useState<Role>("staff");
	const [enabled, setEnabled] = useState<EnabledMap>(() =>
		computeEnabled("staff", null)
	);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const res = await getUsers({ limit: 100 });
				if (res.success) {
					const list = res?.data || [];
					setUsers(list);
					if (list.length > 0) {
						const first = list[0];
						setSelectedUser(first);
						setRole((first.role as Role) || "staff");
						setEnabled(computeEnabled(first.role || "staff", first.access));
					}
				}
			} catch (err) {
				toast({
					title: "Error",
					description: "Failed to load users",
					variant: "destructive",
				});
			} finally {
				setLoading(false);
			}
		};
		fetchUsers();
	}, []);

	const filteredUsers = useMemo(
		() =>
			users.filter(
				(u) =>
					u.username.toLowerCase().includes(search.toLowerCase()) ||
					u.email.toLowerCase().includes(search.toLowerCase())
			),
		[users, search]
	);

	const isFullRole = roleResourceSet(role) === "*";

	const selectUser = (u: UserType) => {
		setSelectedUser(u);
		setRole((u.role as Role) || "staff");
		setEnabled(computeEnabled(u.role || "staff", u.access));
	};

	const changeRole = (next: Role) => {
		setRole(next);
		// Re-derive toggles for the new baseline, preserving saved overrides.
		setEnabled(computeEnabled(next, selectedUser?.access));
	};

	const toggle = (resource: Resource) => {
		if (isFullRole) return;
		setEnabled((prev) => ({ ...prev, [resource]: !prev[resource] }));
	};

	const savedOverrides = useMemo(
		() => normalizeOverrides(selectedUser?.access),
		[selectedUser]
	);
	const currentOverrides = useMemo(
		() => computeOverrides(role, enabled),
		[role, enabled]
	);

	const isDirty =
		!!selectedUser &&
		(selectedUser.role !== role ||
			!sortedEq(currentOverrides.grants, savedOverrides.grants) ||
			!sortedEq(currentOverrides.revokes, savedOverrides.revokes));

	const enabledCount = GRANTABLE_RESOURCES.filter((r) => enabled[r]).length;

	const handleSave = async () => {
		if (!selectedUser?.userId) return;
		setIsSaving(true);
		try {
			const access = computeOverrides(role, enabled);
			const res = await updateUser(selectedUser.userId, { role, access });
			if (res.success) {
				toast({
					title: "Saved",
					description: `Access updated for ${selectedUser.username}`,
				});
				setUsers((prev) =>
					prev.map((u) =>
						u.userId === selectedUser.userId ? { ...u, role, access } : u
					)
				);
				setSelectedUser((prev) => (prev ? { ...prev, role, access } : prev));
			} else {
				toast({
					title: "Update failed",
					description: res.message || "Could not save",
					variant: "destructive",
				});
			}
		} catch (err) {
			toast({
				title: "Update Failed",
				description: "Could not save to server",
				variant: "destructive",
			});
		} finally {
			setIsSaving(false);
		}
	};

	const statusFor = (resource: Resource) => {
		if (isFullRole)
			return { label: "Included", cls: "text-emerald-600 border-emerald-500/40" };
		const roleHas = (roleResourceSet(role) as Set<Resource>).has(resource);
		const on = enabled[resource];
		if (roleHas && on)
			return { label: "Role default", cls: "text-muted-foreground border-border" };
		if (roleHas && !on)
			return { label: "Revoked", cls: "text-rose-600 border-rose-500/40" };
		if (!roleHas && on)
			return { label: "Granted", cls: "text-blue-600 border-blue-500/40" };
		return { label: "Off", cls: "text-muted-foreground/50 border-border/50" };
	};

	if (loading)
		return (
			<div className="h-screen flex items-center justify-center">
				Loading Users...
			</div>
		);

	return (
		<div className="flex h-[calc(100vh-2rem)] overflow-hidden bg-background border rounded-xl m-4 shadow-2xl ring-1 ring-border/50">
			{/* Left Sidebar: User Selection */}
			<div className="w-80 border-r bg-muted/20 flex flex-col">
				<div className="p-4 border-b space-y-4">
					<div className="flex items-center gap-2 px-1">
						<UserCog className="w-5 h-5 text-primary" />
						<h2 className="font-bold text-lg">Users</h2>
					</div>
					<div className="relative">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Filter users..."
							className="pl-9 bg-background/80"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
				</div>

				<ScrollArea className="flex-1">
					<div className="p-2 space-y-1">
						{filteredUsers.map((user) => (
							<button
								key={user.userId}
								onClick={() => selectUser(user)}
								className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
									selectedUser?.userId === user.userId
										? "bg-primary text-primary-foreground shadow-md"
										: "hover:bg-muted text-foreground"
								}`}
							>
								<div className="flex items-center gap-3 text-left">
									<div
										className={`p-2 rounded-md ${
											selectedUser?.userId === user.userId
												? "bg-white/20"
												: "bg-primary/10"
										}`}
									>
										<User className="w-4 h-4" />
									</div>
									<div>
										<p className="text-sm font-semibold truncate w-36">
											{user.username}
										</p>
										<p
											className={`text-[10px] capitalize ${
												selectedUser?.userId === user.userId
													? "text-primary-foreground/70"
													: "text-muted-foreground"
											}`}
										>
											{user.role}
										</p>
									</div>
								</div>
								{selectedUser?.userId === user.userId && (
									<ChevronRight className="w-4 h-4" />
								)}
							</button>
						))}
					</div>
				</ScrollArea>
			</div>

			{/* Right Content */}
			<div className="flex-1 flex flex-col bg-background">
				<AnimatePresence mode="wait">
					{selectedUser ? (
						<motion.div
							key={selectedUser.userId}
							initial={{ opacity: 0, x: 10 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -10 }}
							className="flex flex-col h-full"
						>
							{/* Context Header */}
							<div className="p-6 border-b flex justify-between items-center bg-card">
								<div className="flex items-center gap-4">
									<div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
										<ShieldCheck className="w-6 h-6 text-primary" />
									</div>
									<div>
										<h3 className="text-xl font-bold">
											{selectedUser.username}
										</h3>
										<p className="text-sm text-muted-foreground">
											{selectedUser.email}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<Badge variant="outline" className="px-3 py-1">
										{enabledCount} / {GRANTABLE_RESOURCES.length} modules
									</Badge>
									<Button
										onClick={handleSave}
										disabled={isSaving || !isDirty}
										className="gap-2 px-6"
									>
										{isSaving ? (
											<span className="animate-spin mr-2 inline-block">â³</span>
										) : (
											<Save className="w-4 h-4" />
										)}
										Save Access
									</Button>
								</div>
							</div>

							{/* Role picker */}
							<div className="px-8 py-5 border-b bg-muted/10">
								<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
									Role
								</p>
								<div className="grid grid-cols-3 gap-3">
									{ROLE_OPTIONS.map((r) => {
										const Icon = r.icon;
										const active = role === r.value;
										return (
											<button
												key={r.value}
												onClick={() => changeRole(r.value)}
												className={`text-left p-4 rounded-xl border transition-all ${
													active
														? "border-primary bg-primary/5 ring-2 ring-primary/30"
														: "border-border/60 hover:border-primary/40 hover:bg-muted/40"
												}`}
											>
												<div className="flex items-center gap-2 mb-1">
													<Icon
														className={`w-4 h-4 ${
															active ? "text-primary" : "text-muted-foreground"
														}`}
													/>
													<span className="font-semibold text-sm">
														{r.label}
													</span>
												</div>
												<p className="text-[11px] text-muted-foreground leading-snug">
													{r.description}
												</p>
											</button>
										);
									})}
								</div>
							</div>

							{/* Module toggles header */}
							<div className="px-8 pt-4 pb-2 flex items-center gap-2 text-xs text-muted-foreground">
								<Lock className="w-3.5 h-3.5" />
								{isFullRole
									? "Full-access roles can use every module. Switch to Staff to grant or revoke individual modules."
									: "Toggle which modules this user can see and use. Changes layer on top of the Staff baseline."}
							</div>

							{/* Module toggle list */}
							<ScrollArea className="flex-1 px-4">
								<div className="p-4 space-y-2">
									{GRANTABLE_RESOURCES.map((res) => {
										const status = statusFor(res);
										const sensitive = res === "User" || res === "Settings";
										return (
											<div
												key={res}
												className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
											>
												<div className="flex items-center gap-3 min-w-0">
													<div
														className={`w-2 h-2 rounded-full flex-shrink-0 ${
															enabled[res]
																? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
																: "bg-muted"
														}`}
													/>
													<div className="min-w-0">
														<div className="flex items-center gap-2">
															<span className="font-medium text-sm">{res}</span>
															{sensitive && !isFullRole && enabled[res] && (
																<span title="Sensitive: grants management access">
																	<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
																</span>
															)}
														</div>
														<p className="text-[11px] text-muted-foreground truncate">
															{RESOURCE_INFO[res]}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-3 flex-shrink-0">
													<Badge
														variant="outline"
														className={`text-[10px] ${status.cls}`}
													>
														{status.label}
													</Badge>
													<Switch
														checked={enabled[res]}
														disabled={isFullRole}
														onCheckedChange={() => toggle(res)}
														className="data-[state=checked]:bg-emerald-500"
													/>
												</div>
											</div>
										);
									})}
								</div>
							</ScrollArea>
						</motion.div>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
							<ShieldAlert className="w-16 h-16 opacity-20" />
							<p className="text-lg font-medium">
								Select a user to manage their access
							</p>
						</div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
