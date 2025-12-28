import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	ShieldCheck, User, Search, Save, ShieldAlert, ChevronRight, UserCog
} from "lucide-react";
import { getUsers, updateUser } from "@/api/user.api";
import type { User as UserType } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const RESOURCES = [
	"MembershipMaster", "Membership", "MembershipLink", "Course",
	"CoursePackage", "CourseShare", "CourseRate", "Activity",
	"Batch", "BatchMember", "Entity", "Account",
	"Member", "AccountMember", "Authority", "CoachAssignment"
];
const ACTIONS = ["read", "create", "update", "delete"] as const;

export default function UserAccessPage() {
	const [users, setUsers] = useState<UserType[]>([]);
	const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const res = await getUsers({ limit: 100 });
				if (res.success) {
					setUsers(res?.data || []);
					if ((res?.data || []).length > 0) setSelectedUser(res?.data?.[0] || null);
				}
			} catch (err) {
				toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
			} finally {
				setLoading(false);
			}
		};
		fetchUsers();
	}, []);

	const filteredUsers = useMemo(() =>
		users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())),
		[users, search]
	);

	const handleToggle = (resource: string, action: string) => {
		if (!selectedUser) return;

		const currentAccess = [...(selectedUser.access || [])];
		const resourceIdx = currentAccess.findIndex(a => a.resource === resource);

		if (resourceIdx > -1) {
			const actions = [...currentAccess[resourceIdx].actions];
			if (actions.includes(action as any)) {
				currentAccess[resourceIdx].actions = actions.filter(a => a !== action);
			} else {
				currentAccess[resourceIdx].actions = [...actions, action as any];
			}
			if (currentAccess[resourceIdx].actions.length === 0) currentAccess.splice(resourceIdx, 1);
		} else {
			currentAccess.push({ resource, actions: [action as any] });
		}

		const updatedUser = { ...selectedUser, access: currentAccess };
		setSelectedUser(updatedUser);
		setUsers(prev => prev.map(u => u.userId === updatedUser.userId ? updatedUser : u));
	};

	const handleSave = async () => {
		if (!selectedUser?.userId) return;
		setIsSaving(true);
		try {
			const res = await updateUser(selectedUser.userId, { access: selectedUser.access });
			if (res.success) {
				toast({ title: "Success", description: `Permissions updated for ${selectedUser.username}` });
			}
		} catch (err) {
			toast({ title: "Update Failed", description: "Could not save to server", variant: "destructive" });
		} finally {
			setIsSaving(false);
		}
	};

	if (loading) return <div className="h-screen flex items-center justify-center">Loading User Matrix...</div>;

	return (
		<div className="flex h-[calc(100-2rem)] overflow-hidden bg-background border rounded-xl m-4 shadow-2xl ring-1 ring-border/50">
			{/* Left Sidebar: User Selection */}
			<div className="w-80 border-r bg-muted/20 flex flex-col">
				<div className="p-4 border-b space-y-4">
					<div className="flex items-center gap-2 px-1">
						<UserCog className="w-5 h-5 text-primary" />
						<h2 className="font-bold text-lg">Administrators</h2>
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
								onClick={() => setSelectedUser(user)}
								className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${selectedUser?.userId === user.userId
									? "bg-primary text-primary-foreground shadow-md"
									: "hover:bg-muted text-foreground"
									}`}
							>
								<div className="flex items-center gap-3 text-left">
									<div className={`p-2 rounded-md ${selectedUser?.userId === user.userId ? "bg-white/20" : "bg-primary/10"}`}>
										<User className="w-4 h-4" />
									</div>
									<div>
										<p className="text-sm font-semibold truncate w-36">{user.username}</p>
										<p className={`text-[10px] ${selectedUser?.userId === user.userId ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
											{user.role}
										</p>
									</div>
								</div>
								{selectedUser?.userId === user.userId && <ChevronRight className="w-4 h-4" />}
							</button>
						))}
					</div>
				</ScrollArea>
			</div>

			{/* Right Content: Permission Matrix */}
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
										<h3 className="text-xl font-bold">{selectedUser.username}</h3>
										<p className="text-sm text-muted-foreground">{selectedUser.email}</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<Badge variant="outline" className="px-3 py-1">
										ID: {selectedUser.userId}
									</Badge>
									<Button onClick={handleSave} disabled={isSaving} className="gap-2 px-6">
										{isSaving ? <span className="animate-spin mr-2 inline-block">⏳</span> : <Save className="w-4 h-4" />}
										Save Permissions
									</Button>
								</div>
							</div>

							{/* Grid Header */}
							<div className="grid grid-cols-12 gap-4 px-8 py-4 bg-muted/30 border-b text-xs font-bold uppercase tracking-wider text-muted-foreground">
								<div className="col-span-4">Resource / Table Name</div>
								<div className="col-span-2 text-center">Read</div>
								<div className="col-span-2 text-center">Create</div>
								<div className="col-span-2 text-center">Update</div>
								<div className="col-span-2 text-center">Delete</div>
							</div>

							{/* Matrix Scroll Area */}
							<ScrollArea className="flex-1 px-4">
								<div className="p-4 space-y-2">
									{RESOURCES.map((res) => {
										const access = selectedUser.access?.find(a => a.resource === res);
										return (
											<motion.div
												key={res}
												whileHover={{ scale: 1.002 }}
												className="grid grid-cols-12 gap-4 items-center p-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors group"
											>
												<div className="col-span-4 flex items-center gap-2">
													<div className={`w-2 h-2 rounded-full ${access?.actions.length ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted'}`} />
													<span className="font-medium text-sm">{res}</span>
												</div>
												{ACTIONS.map((action) => (
													<div key={action} className="col-span-2 flex justify-center">
														<Switch
															checked={access?.actions.includes(action) || false}
															onCheckedChange={() => handleToggle(res, action)}
															className="data-[state=checked]:bg-emerald-500"
														/>
													</div>
												))}
											</motion.div>
										);
									})}
								</div>
							</ScrollArea>
						</motion.div>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
							<ShieldAlert className="w-16 h-16 opacity-20" />
							<p className="text-lg font-medium">Select a user to manage their security profile</p>
						</div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}