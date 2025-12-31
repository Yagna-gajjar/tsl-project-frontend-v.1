import { useState, useRef, useEffect, useMemo } from "react"
import {
	Check,
	ChevronsUpDown,
	Users,
	MapPin,
	Phone,
	Mail,
	Activity,
	Briefcase,
	CalendarDays,
	Layers,
	Search,
	Filter,
	Clock,
	Info,
	Trash2
} from "lucide-react"
import { Virtuoso } from "react-virtuoso"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"

// --- Strict Types ---
import type { Member } from "@/types/member"
import type { Enrollment } from "@/types/enrollment"
import type { Response } from "@/types/response"
import { getMembers } from "@/api/member.api"
import { deleteEnrollment, getEnrollments, loadEnrollmentById } from "@/api/enrollment.api"
import { EnrollmentActionModal } from "../enrollment-action-modal"

export function MemberTab({
	data,
	onUpdate,
}: {
	data?: Member
	onUpdate: (data: Partial<Enrollment>) => void
}) {
	const [open, setOpen] = useState(false)
	const [isActionModalOpen, setIsActionModalOpen] = useState(false)
	const [members, setMembers] = useState<Member[]>([])
	const [selectedMember, setSelectedMember] = useState<Member | null>(data || null)
	const [loading, setLoading] = useState(false)
	const [enrollments, setEnrollments] = useState<Enrollment[]>([])
	const debounceRef = useRef<NodeJS.Timeout | null>(null)

	// Local Filter States
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState<string>("all")

	const fetchEnrollmentsOfMember = async (memberId: number) => {
		try {
			const eRes: Response<Enrollment[]> = await getEnrollments({ memberId });
			if (eRes.success) {
				setEnrollments(eRes?.data || []);
			} else {
				throw new Error("Failed to fetch");
			}
		} catch {
			toast({
				title: "Error",
				description: "Failed to fetch Enrollments",
				variant: "destructive"
			})
		}
	}

	const deleteDraftEnrollment = async (enrollmentId: number) => {
		// Basic confirmation to prevent accidental clicks
		if (!confirm("Are you sure you want to delete this draft?")) return;

		try {
			const eRes: Response<Enrollment> = await deleteEnrollment(enrollmentId);
			if (eRes.success) {
				// Update UI by filtering the local state
				setEnrollments((prev) => prev.filter((enr) => enr.enrollmentId !== enrollmentId));

				toast({
					title: "Deleted",
					description: "Draft enrollment removed successfully.",
				});
			} else {
				throw new Error("Failed to delete");
			}
		} catch {
			toast({
				title: "Error",
				description: "Failed to delete Enrollment",
				variant: "destructive"
			});
		}
	}

	useEffect(() => {
		if (data?.memberId) {
			fetchEnrollmentsOfMember(Number(data.memberId));
		}
	}, [data]);

	// Local Filtering Logic
	const filteredEnrollments = useMemo(() => {
		return enrollments.filter((enr) => {
			const matchesSearch = (enr.courseName as string).toLowerCase().includes(searchTerm.toLowerCase()) ||
				(enr.enrollmentNo as number ?? "").toString().includes(searchTerm);
			const matchesStatus = statusFilter === "all" || enr.status?.toLowerCase() === statusFilter.toLowerCase();
			return matchesSearch && matchesStatus;
		});
	}, [enrollments, searchTerm, statusFilter]);

	const loadDateToVariables = async (enrollmentId: number) => {
		try {
			const lRes = await loadEnrollmentById(enrollmentId);
			if (lRes.success) {
				onUpdate(lRes.data || {});

				toast({
					title: "Success",
					description: "Enrollment details loaded.",
				});
			} else {
				throw new Error();
			}
		} catch {
			toast({
				title: "Error",
				variant: "destructive",
				description: "Failed to load Enrollment details."
			});
		}
	}

	const fetchMembersDebounced = (query: string) => {
		if (!query || query.trim().length < 2) {
			setMembers([])
			return
		}
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(async () => {
			setLoading(true)
			try {
				const response = await getMembers({ search: query, limit: 50 });
				setMembers(response.data || [])
			} catch (err) {
				toast({ title: "Error", description: "failed to search members", variant: "destructive" })
			} finally {
				setLoading(false)
			}
		}, 400)
	}

	return (
		<div className="space-y-6 max-w-7xl mx-auto p-1">
			{/* 1. SELECTION SECTION */}
			<div className="space-y-2">
				<label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Target Member</label>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button variant="outline" role="combobox" className="w-full justify-between h-11 border-blue-100 shadow-sm bg-white">
							<div className="flex items-center gap-2">
								<Users className="w-4 h-4 text-blue-600" />
								<span className="font-semibold">
									{selectedMember?.memberId
										? `${selectedMember.memberFirstName} ${selectedMember.memberLastName}`
										: "Search and select a member..."}
								</span>
							</div>
							<ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 text-slate-400" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-2xl border-blue-50">
						<Command shouldFilter={false}>
							<CommandInput placeholder="Search by name, phone, or email..." onValueChange={fetchMembersDebounced} />
							<CommandList>
								<CommandEmpty>{loading ? "Searching databases..." : "No member found."}</CommandEmpty>
								<CommandGroup>
									{members.map((member) => (
										<CommandItem
											key={member.memberId}
											onSelect={() => {
												setSelectedMember(member);
												// Important: wrap it in the member key so it matches the state structure
												onUpdate({ member: member });
												setOpen(false);
												fetchEnrollmentsOfMember(Number(member.memberId));
											}}
										>
											<Check className={`mr-2 h-4 w-4 ${selectedMember?.memberId === member.memberId ? "text-blue-600" : "opacity-0"}`} />
											<div className="flex flex-col">
												<span className="font-bold text-slate-900">{member.memberFirstName} {member.memberLastName}</span>
												<span className="text-[10px] text-slate-500">{member.contactNumber || member.email}</span>
											</div>
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
			</div>

			{selectedMember?.memberId && (
				<>
					{/* 2. TOP: MEMBER INFO CARD */}
					<Card className="p-4 border-none shadow-md bg-white overflow-hidden relative">
						<div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
						<div className="flex flex-col md:flex-row justify-between items-center gap-6">
							<div className="flex items-center gap-4">
								<div className="h-16 w-16 rounded-full border-2 border-blue-50 p-0.5 overflow-hidden bg-slate-100 flex-shrink-0">
									{selectedMember.avatar ? (
										<img
											src={`${import.meta.env.VITE_APP_R2_PUBLIC_ENDPOINT}/${selectedMember.avatar}`}
											alt="Avatar"
											className="h-full w-full rounded-full object-cover"
										/>
									) : (
										<div className="h-full w-full rounded-full flex items-center justify-center bg-blue-50 text-blue-600">
											<Users className="w-8 h-8" />
										</div>
									)}
								</div>
								<div className="space-y-1">
									<h2 className="text-xl font-black text-slate-900 leading-none tracking-tight">
										{selectedMember.memberFirstName} {selectedMember.memberLastName}
									</h2>
									<div className="flex items-center gap-2">
										<Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50">
											Status: {selectedMember.status}
										</Badge>
									</div>
								</div>
							</div>

							<Separator orientation="vertical" className="hidden md:block h-12" />

							<div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 w-full md:w-auto">
								<DetailItem icon={<Mail className="w-3 h-3" />} label="Email" value={selectedMember.email || "N/A"} />
								<DetailItem icon={<Phone className="w-3 h-3" />} label="Phone" value={selectedMember.contactNumber || "N/A"} />
								<DetailItem icon={<MapPin className="w-3 h-3" />} label="Location" value={`${selectedMember.city || ''}, ${selectedMember.state || ''}`} />
							</div>
						</div>
					</Card>

					{/* 3. BOTTOM: ENROLLMENTS SECTION */}
					<div className="space-y-4">
						<div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-4 border-b border-slate-100 pb-2">
							<h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-wider">
								<Activity className="w-4 h-4 text-blue-600" />
								Enrollments History ({filteredEnrollments.length})
							</h3>

							{/* Local Filters Row */}
							<div className="flex items-center gap-2 w-full md:w-auto">
								<div className="relative flex-1 md:w-64">
									<Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
									<Input
										placeholder="Search course or ID..."
										className="pl-8 h-9 text-xs border-slate-200 bg-white"
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
								</div>
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger className="w-[120px] h-9 text-xs bg-white border-slate-200">
										<Filter className="w-3 h-3 mr-2 text-blue-600" />
										<SelectValue placeholder="Status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All</SelectItem>
										<SelectItem value="created">Created</SelectItem>
										<SelectItem value="draft">Draft</SelectItem>
										<SelectItem value="approvalpending">Pending</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Virtuoso List Container */}
						<div className="h-[550px] border border-slate-100 rounded-xl bg-slate-50/20 shadow-inner overflow-hidden">
							{filteredEnrollments.length > 0 ? (
								<Virtuoso
									data={filteredEnrollments}
									itemContent={(_, enrollment) => (
										<div className="px-3 py-1.5">
											<EnrollmentCard
												enrollment={enrollment}
												loadDateToVariables={loadDateToVariables}
												onDelete={deleteDraftEnrollment}
												isActionModalOpen={isActionModalOpen}
												setIsActionModalOpen={setIsActionModalOpen}
											/>
										</div>
									)}
								/>
							) : (
								<div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
									<Search className="w-10 h-10 opacity-10" />
									<p className="text-xs font-medium italic">No enrollments match your current filters.</p>
								</div>
							)}
						</div>
					</div>
				</>
			)}
		</div>
	)
}

function EnrollmentCard({ enrollment, loadDateToVariables, onDelete, isActionModalOpen, setIsActionModalOpen }: { enrollment: Enrollment, loadDateToVariables: (x: number) => void, onDelete: (x: number) => void, isActionModalOpen: boolean, setIsActionModalOpen: any }) {
	const getDaysFromPattern = (pattern: string | null) => {
		if (!pattern) return "N/A";
		const daysMap: Record<string, string> = { "1": "Mon", "2": "Tue", "3": "Wed", "4": "Thu", "5": "Fri", "6": "Sat", "7": "Sun" };
		return pattern.split("").map(d => daysMap[d]).join(", ");
	};

	const renderActionButton = () => {
		const status = enrollment.status?.toLowerCase();

		if (status === "draft") {
			return (
				<div className="flex items-center gap-2">
					{/* Delete Button - Only for Drafts */}
					<Button
						size="sm"
						variant="ghost"
						className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
						onClick={() => onDelete(enrollment.enrollmentId)}
					>
						<Trash2 className="w-4 h-4" />
					</Button>

					<Button
						size="sm"
						className="h-7 px-4 bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase shadow-sm"
						onClick={() => loadDateToVariables(enrollment.enrollmentId)}
					>
						Load Enr
					</Button>
				</div>
			);
		}

		if (status === "approvalpending") {
			return (
				<Button
					size="sm"
					className="h-7 px-4 bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase shadow-sm"
					onClick={() => loadDateToVariables(enrollment.enrollmentId)}
				>
					Load Enr
				</Button>
			);
		}

		if (status === "created" || status === "create") {
			return (
				<>
					<Button
						size="sm"
						variant="outline"
						className="h-7 px-4 border-blue-200 text-blue-700 hover:bg-blue-50 text-[10px] font-black uppercase"
						onClick={() => setIsActionModalOpen(true)} // Open the modal
					>
						Change
					</Button>

					{/* Render the modal component here */}
					<EnrollmentActionModal
						isOpen={isActionModalOpen}
						onClose={() => setIsActionModalOpen(false)}
						enrollment={enrollment}
					/>
				</>
			)
		}
		return null;
	};

	return (
		<Card className="border border-slate-100 bg-white hover:border-blue-200 hover:shadow-md transition-all">
			<div className="p-3">
				{/* Compact Header */}
				<div className="flex justify-between items-start mb-2">
					<div className="min-w-0">
						<div className="flex items-center gap-2 mb-1">
							<h4 className="font-black text-xs text-slate-900 truncate uppercase tracking-tight">{enrollment.courseName}</h4>
							<Badge className="bg-emerald-50 text-emerald-700 border-none text-[8px] h-4 font-bold">
								{enrollment.membershipType}
							</Badge>
						</div>
						<div className="flex items-center gap-1 text-blue-600 text-[9px] font-bold">
							<Briefcase className="w-3 h-3" />
							{enrollment.academyEntityName}
						</div>
					</div>
					<div className="flex flex-col items-end flex-shrink-0">
						<span className="text-[8px] font-black text-slate-400 uppercase">Enrollment No</span>
						<span className="text-[11px] font-mono font-black text-slate-800 tracking-tighter">#{enrollment.enrollmentNo}</span>
					</div>
				</div>

				{/* Compact Detail Grid */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50 p-2 rounded-lg border border-slate-50 mb-2">
					<MiniInfo label="Duration" value={`${new Date(enrollment.attendingStartDate as string).toLocaleDateString()}`} icon={<CalendarDays className="w-2.5 h-2.5 text-blue-500" />} />
					<MiniInfo label="Schedule" value={getDaysFromPattern(enrollment.attendingPattern as string)} icon={<Clock className="w-2.5 h-2.5 text-blue-500" />} />
					<MiniInfo label="Units" value={`${enrollment.billingDaysSessions} Sessions`} icon={<Layers className="w-2.5 h-2.5 text-blue-500" />} />
					<div className="space-y-0.5">
						<p className="text-[8px] text-slate-400 uppercase font-black">Total Paid</p>
						<p className="text-[11px] font-black text-emerald-600">₹{Number(enrollment.totalDebitAmount).toLocaleString()}</p>
					</div>
				</div>

				{/* Status and Action Row */}
				<div className="flex items-center justify-between pt-1">
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-1.5">
							<div className={`w-1.5 h-1.5 rounded-full ${enrollment.status === 'created' ? 'bg-emerald-500' : 'bg-blue-400'}`} />
							<span className="text-[9px] font-black uppercase text-slate-600">{enrollment.status}</span>
						</div>
						{enrollment.printRemarks && (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="w-3.5 h-3.5 text-slate-300 cursor-help hover:text-blue-500 transition-colors" />
									</TooltipTrigger>
									<TooltipContent side="right" className="bg-slate-900 text-white border-none p-2 max-w-xs shadow-xl">
										<p className="text-[10px] leading-relaxed">{enrollment.printRemarks}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>
					{renderActionButton()}
				</div>
			</div>
		</Card>
	);
}

function MiniInfo({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
	return (
		<div className="space-y-0.5 overflow-hidden">
			<p className="text-[8px] text-slate-400 uppercase font-black flex items-center gap-1">{icon} {label}</p>
			<p className="text-[10px] font-bold text-slate-700 truncate leading-tight">{value}</p>
		</div>
	)
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
	return (
		<div className="flex items-center gap-2">
			<div className="h-7 w-7 rounded bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 flex-shrink-0">
				{icon}
			</div>
			<div className="min-w-0">
				<p className="text-[8px] text-slate-400 uppercase font-black leading-none mb-0.5">{label}</p>
				<p className="text-[11px] font-bold text-slate-700 truncate">{value}</p>
			</div>
		</div>
	)
}