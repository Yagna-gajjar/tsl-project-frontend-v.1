import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	Eye, EyeOff, Settings2, RefreshCw, Search,
	Database, Activity, Plus, Save, X, Info
} from "lucide-react";

// API & Types
import { getEnumsByCategory, updateEnum, createEnum } from "@/api/enums.api";
import type { Enums } from "@/types/enums";

// UI Components
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// --- Internal Helper: EnumFormModal (Optimized Local HTML) ---
type ModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSave: () => void;
};

function EnumFormModal({ isOpen, onClose, onSave }: ModalProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		value: "",
		enumCase: 1, // Default to Visible
		status: true // Boolean
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.value.trim()) {
			toast({ title: "Validation Error", description: "Name is required", variant: "destructive" });
			return;
		}

		setIsSubmitting(true);
		try {
			const payload = {
				category: "STATUSVISIBLE",
				value: formData.value.trim(),
				enumCase: formData.enumCase,
				status: formData.status // Sending as boolean
			};

			const res = await createEnum(payload as Enums);
			if (res.success) {
				toast({ title: "Success", description: "Resource added successfully." });
				setFormData({ value: "", enumCase: 1, status: true });
				onSave();
				onClose();
			}
		} catch (err) {
			toast({ title: "Error", description: "Failed to create resource.", variant: "destructive" });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-md p-0 overflow-hidden border-border/50 shadow-2xl bg-background rounded-xl">
				<div className="px-6 py-4 border-b flex justify-between items-center bg-muted/30">
					<h2 className="text-lg font-bold flex items-center gap-2">
						<Plus className="w-5 h-5 text-primary" />
						New Resource
					</h2>
				</div>

				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					<div className="space-y-1.5">
						<label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="val">
							Resource Name
						</label>
						<input
							id="val"
							className="w-full h-10 px-3 bg-background border border-input rounded-md ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
							placeholder="e.g. MemberMaster"
							value={formData.value}
							onChange={(e) => setFormData({ ...formData, value: e.target.value })}
						/>
					</div>

					<div className="pt-4 flex items-center justify-end gap-3 border-t">
						<Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
						<Button type="submit" disabled={isSubmitting} className="gap-2 shadow-lg shadow-primary/20">
							{isSubmitting ? "Processing..." : <><Save className="w-4 h-4" /> Save Setting</>}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// --- Main Page Component: StatusVisible ---
export default function StatusVisible() {
	const [enums, setEnums] = useState<Enums[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [isUpdating, setIsUpdating] = useState<number | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);

	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const res = await getEnumsByCategory("STATUSVISIBLE", { limit: 100 });
			if (res.success) {
				setEnums(res.data || []);
			}
		} catch (err) {
			toast({ title: "Fetch Error", description: "Failed to load settings.", variant: "destructive" });
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { fetchData(); }, [fetchData]);

	const handleToggle = async (item: Enums) => {
		if (!item.id) return;
		const newValue = item.enumCase === 1 ? 0 : 1;
		setIsUpdating(item.id);

		const updatedItem: Enums = {
			...item,
			enumCase: newValue,
			status: true
		};

		try {
			const res = await updateEnum(item.id, updatedItem);
			if (res.success) {
				setEnums((prev) => prev.map((e) => (e.id === item.id ? updatedItem : e)));
				toast({
					title: "Sync Complete",
					description: `${item.value} visibility updated.`,
				});
			}
		} catch (err) {
			toast({ title: "Sync Failed", variant: "destructive" });
		} finally {
			setIsUpdating(null);
		}
	};

	const filteredEnums = useMemo(() =>
		enums.filter((e) => e.value.toLowerCase().includes(search.toLowerCase())),
		[enums, search]
	);

	return (
		<div className="p-6 max-w-[1400px] mx-auto space-y-8 min-h-screen">
			{/* Header Section */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
				<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
					<div className="flex items-center gap-3 mb-1">
						<Settings2 className="w-8 h-8 text-primary" />
						<h1 className="text-3xl font-black tracking-tighter">Visibility Hub</h1>
					</div>
					<p className="text-muted-foreground text-sm font-medium">
						Configure data fetching visibility across system modules.
					</p>
				</motion.div>

				<div className="flex items-center gap-3 w-full md:w-auto">
					<div className="relative flex-1 md:w-72">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input
							placeholder="Search resources..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-10 h-11 bg-background"
						/>
						{search && (
							<button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
								<X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
							</button>
						)}
					</div>
					<Button variant="outline" size="icon" className="h-11 w-11" onClick={fetchData} disabled={loading}>
						<RefreshCw className={loading ? "animate-spin" : ""} />
					</Button>
					<Button onClick={() => setIsFormOpen(true)} className="h-11 px-5 gap-2 shadow-md">
						<Plus className="w-4 h-4" /> Add New
					</Button>
				</div>
			</div>

			{loading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="h-44 rounded-2xl bg-muted/40 animate-pulse border" />
					))}
				</div>
			) : (
				<motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<AnimatePresence mode="popLayout">
						{filteredEnums.map((item) => (
							<motion.div
								key={item.id}
								layout
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.95 }}
								whileHover={{ y: -5 }}
							>
								<Card className={`relative overflow-hidden border-2 transition-all duration-300 ${item.enumCase === 1 ? 'border-primary/20 bg-primary/[0.02]' : 'border-border'
									}`}>
									<CardHeader className="pb-4">
										<div className="flex justify-between items-start">
											<div className={`p-2 rounded-lg bg-background border shadow-sm ${item.enumCase === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
												<Database className="w-5 h-5" />
											</div>
											<div className="flex flex-col items-end gap-1.5">
												<Badge variant={item.enumCase === 1 ? "default" : "secondary"} className="rounded-full px-3">
													{item.enumCase === 1 ? "Active" : "Hidden"}
												</Badge>
												<span className={`text-[10px] font-black uppercase tracking-widest ${item.status ? 'text-emerald-500' : 'text-rose-500'}`}>
													Status: {item.status ? "True" : "False"}
												</span>
											</div>
										</div>
										<CardTitle className="text-lg font-extrabold mt-4 tracking-tight">{item.value}</CardTitle>
										<CardDescription className="text-[10px] font-bold uppercase opacity-50 tracking-tighter">
											Ref: {item.category}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="flex items-center justify-between p-3 rounded-xl border bg-background/50 backdrop-blur-sm">
											<div className="flex items-center gap-2">
												{item.enumCase === 1 ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-rose-500" />}
												<span className="text-[10px] font-black uppercase tracking-wider">Visibility</span>
											</div>
											<Switch
												checked={item.enumCase === 1}
												onCheckedChange={() => handleToggle(item)}
												disabled={isUpdating === item.id}
												className="data-[state=checked]:bg-emerald-500"
											/>
										</div>
									</CardContent>
									<Activity className={`absolute -right-6 -bottom-6 w-20 h-20 opacity-[0.03] pointer-events-none ${item.enumCase === 1 ? 'text-primary' : 'text-muted-foreground'}`} />
								</Card>
							</motion.div>
						))}
					</AnimatePresence>
				</motion.div>
			)}

			{/* Empty State */}
			{!loading && filteredEnums.length === 0 && (
				<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
					<div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
						<Info className="w-10 h-10 text-muted-foreground/30" />
					</div>
					<h3 className="text-xl font-bold">No resources found</h3>
					<p className="text-muted-foreground text-sm max-w-[250px] mx-auto mt-2">
						Try adjusting your search to find the resource you are looking for.
					</p>
					<Button variant="link" onClick={() => setSearch("")} className="mt-2 font-bold">Clear Search</Button>
				</motion.div>
			)}

			<EnumFormModal
				isOpen={isFormOpen}
				onClose={() => setIsFormOpen(false)}
				onSave={fetchData}
			/>
		</div>
	);
}