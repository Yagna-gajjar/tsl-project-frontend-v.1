import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import {
	Check,
	ChevronsUpDown,
	Users,
	MapPin,
	Phone,
	Mail,
	Activity,
	Search,
	Filter,
	Eye,
	UserPlus,
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
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

import type { Member } from "@/types/member"
import type { Enrollment } from "@/types/enrollment"
import type { Response } from "@/types/response"
import type { Account } from "@/types/account"

import { getMembers } from "@/api/member.api"
import { deleteEnrollment, getEnrollments, loadEnrollmentById } from "@/api/enrollment.api"
import { getAccountsWithAllMembersByMemberId } from "@/api/accountMember.api"

// ── Split components ──────────────────────────────────────────────────────────
import { EnrollmentCard, DetailItem } from "./enrollment-card"
import { AddMemberModal } from "./add-member"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
// import { AccountAccordion } from "./add-member"

// ─── MemberTab ────────────────────────────────────────────────────────────────

export function MemberTab({
	data,
	onUpdate,
}: {
	data?: Member
	onUpdate: (data: Partial<Enrollment>) => void
}) {
	const [open, setOpen] = useState(false)
	const [openShowFamily, setOpenShowFamily] = useState(false)
	const [isActionModalOpen, setIsActionModalOpen] = useState(false)

	const [members, setMembers] = useState<Member[]>([])
	const [selectedMember, setSelectedMember] = useState<Member | null>(data || null)
	const [familyMembers, setFamilyMembers] = useState<any[]>([])

	const [loading, setLoading] = useState(false)
	const [enrollments, setEnrollments] = useState<Enrollment[]>([])
	const debounceRef = useRef<NodeJS.Timeout | null>(null)

	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState<string>("all")

	const [formOpen, setFormOpen] = useState(false)
	const [selectedAccount, setSelectedAccount] = useState()
	const [refreshKey, setRefreshKey] = useState(0)

	// ─── API ─────────────────────────────────────────────────────────────────────

	const fetchFamilyMembers = useCallback(async () => {
		if (!selectedMember?.memberId) return
		setLoading(true)
		try {
			const res = await getAccountsWithAllMembersByMemberId(String(selectedMember.memberId))
			console.log(res?.data);

			setFamilyMembers(res.data || [])
		} catch {
			toast({ title: "Error", description: "Failed to fetch family members", variant: "destructive" })
		} finally {
			setLoading(false)
		}
	}, [selectedMember?.memberId])

	const fetchEnrollmentsOfMember = async (memberId: number) => {
		try {
			const eRes: Response<Enrollment[]> = await getEnrollments({ memberId })
			if (eRes.success) setEnrollments(eRes?.data || [])
		} catch {
			toast({ title: "Error", description: "Failed to fetch Enrollments", variant: "destructive" })
		}
	}

	const fetchMembersDebounced = (query: string) => {
		if (!query || query.trim().length < 2) {
			setMembers([])
			return
		}
		if (debounceRef.current) clearTimeout(debounceRef.current)
		debounceRef.current = setTimeout(async () => {
			setLoading(true)
			try {
				const response = await getMembers({ search: query, limit: 50 })
				setMembers(response.data || [])
			} finally {
				setLoading(false)
			}
		}, 400)
	}

	const deleteDraftEnrollment = async (enrollmentId: number) => {
		if (!confirm("Are you sure you want to delete this draft?")) return
		try {
			const eRes: Response<Enrollment> = await deleteEnrollment(enrollmentId)
			if (eRes.success) {
				setEnrollments((prev) => prev.filter((enr) => enr.enrollmentId !== enrollmentId))
				toast({ title: "Deleted", description: "Draft enrollment removed." })
			}
		} catch {
			toast({ title: "Error", description: "Failed to delete Enrollment", variant: "destructive" })
		}
	}

	const loadDateToVariables = async (enrollmentId: number) => {
		try {
			const lRes = await loadEnrollmentById(enrollmentId)
			if (lRes.success) {
				onUpdate(lRes.data || {})
				toast({ title: "Success", description: "Enrollment details loaded." })
			}
		} catch {
			toast({ title: "Error", variant: "destructive", description: "Failed to load details." })
		}
	}

	// ─── Derived Data ───────────────────────────────────────────────────────────── 

	const groupedAccounts = familyMembers.reduce(
		(acc, item) => {
			if (!acc[item.accountId]) {
				acc[item.accountId] = {
					accountId: item.accountId,
					accountName: item.accountName,
					members: [],
				}
			}
			acc[item.accountId].members.push(item)
			return acc
		},
		{} as Record<string, any>,
	)

	const accountsArray: Account[] = Object.values(groupedAccounts)
	console.log(accountsArray, " = account array");

	const filteredEnrollments = useMemo(() => {
		return enrollments.filter((enr) => {
			const matchesSearch =
				(enr.courseName as string).toLowerCase().includes(searchTerm.toLowerCase()) ||
				(enr.enrollmentNo as number ?? "").toString().includes(searchTerm)
			const matchesStatus =
				statusFilter === "all" || enr.status?.toLowerCase() === statusFilter.toLowerCase()
			return matchesSearch && matchesStatus
		})
	}, [enrollments, searchTerm, statusFilter])

	// ─── Effects ──────────────────────────────────────────────────────────────────

	useEffect(() => {
		if (data?.memberId) fetchEnrollmentsOfMember(Number(data.memberId))
	}, [data])

	useEffect(() => {
		if (openShowFamily) fetchFamilyMembers()
	}, [openShowFamily, fetchFamilyMembers, refreshKey])

	// ─── Render ───────────────────────────────────────────────────────────────────

	return (
		<div className="space-y-6 max-w-7xl mx-auto p-1">

			{/* 1. MEMBER SEARCH */}
			<div className="space-y-2">
				<label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
					Target Member
				</label>
				<div className="flex flex-col md:flex-row gap-3 items-center">
					<div className="flex-1 w-full">
						<Popover open={open} onOpenChange={setOpen}>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									role="combobox"
									className="w-full justify-between h-11 border-blue-100 shadow-sm bg-white"
								>
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
									<CommandInput
										placeholder="Search by name, phone, or email..."
										onValueChange={fetchMembersDebounced}
									/>
									<CommandList>
										<CommandEmpty>
											{loading ? "Searching databases..." : "No member found."}
										</CommandEmpty>
										<CommandGroup>
											{members.map((member) => (
												<CommandItem
													key={member.memberId}
													onSelect={() => {
														setSelectedMember(member)
														onUpdate({ member: member })
														setOpen(false)
														fetchEnrollmentsOfMember(Number(member.memberId))
													}}
												>
													<Check
														className={`mr-2 h-4 w-4 ${selectedMember?.memberId === member.memberId
															? "text-blue-600"
															: "opacity-0"
															}`}
													/>
													<div className="flex flex-col">
														<span className="font-bold text-slate-900">
															{member.memberFirstName} {member.memberLastName}
														</span>
														<span className="text-[10px] text-slate-500">
															{member.contactNumber || member.email}
														</span>
													</div>
												</CommandItem>
											))}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
					</div>

					<Button
						disabled={!selectedMember}
						variant="outline"
						className="h-11 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold px-6"
						onClick={() => setOpenShowFamily(true)}
					>
						<Eye className="w-4 h-4 mr-2" />
						Show Family
					</Button>
				</div>
			</div>

			{selectedMember?.memberId && (
				<>
					{/* 2. MEMBER INFO CARD */}
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
									<Badge
										variant="outline"
										className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50 uppercase font-black"
									>
										Status: {selectedMember.status}
									</Badge>
								</div>
							</div>

							<Separator orientation="vertical" className="hidden md:block h-12" />

							<div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 w-full md:w-auto">
								<DetailItem icon={<Mail className="w-3 h-3" />} label="Email" value={selectedMember.email || "N/A"} />
								<DetailItem icon={<Phone className="w-3 h-3" />} label="Phone" value={selectedMember.contactNumber || "N/A"} />
								<DetailItem
									icon={<MapPin className="w-3 h-3" />}
									label="Location"
									value={`${selectedMember.city || ""}${selectedMember.state ? `, ${selectedMember.state}` : ""}`}
								/>
							</div>
						</div>
					</Card>

					{/* 3. ENROLLMENTS SECTION */}
					<div className="space-y-4">
						<div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-4 border-b border-slate-100 pb-2">
							<h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-wider">
								<Activity className="w-4 h-4 text-blue-600" />
								Enrollments History ({filteredEnrollments.length})
							</h3>
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
									<p className="text-xs font-medium italic">
										No enrollments match your current filters.
									</p>
								</div>
							)}
						</div>
					</div>
				</>
			)}

			{/* 4. FAMILY MODAL */}
			<Dialog open={openShowFamily} onOpenChange={setOpenShowFamily}>
				<DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white">

					{/* Header */}
					<div className="bg-gradient-to-br from-blue-50 to-transparent px-6 pt-6 pb-8 relative overflow-hidden">
						<div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl" />
						<div className="absolute bottom-0 left-1/2 w-24 h-24 rounded-full bg-blue-400/10 blur-xl" />
						<div className="relative flex items-center gap-3">
							<div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center backdrop-blur-sm">
								<Users className="w-5 h-5 text-blue-600" />
							</div>
							<div>
								<h2 className="font-black text-base tracking-tight leading-none">Account Relations</h2>
								<p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-0.5">
									{selectedMember?.memberFirstName} {selectedMember?.memberLastName}
								</p>
							</div>
						</div>
					</div>

					{/* Body */}
					<div className="min-h-[360px] max-h-[55vh] overflow-y-auto p-5 space-y-3">
						{loading ? (
							<div className="flex flex-col justify-center items-center h-48 space-y-4">
								<div className="relative">
									<div className="w-12 h-12 rounded-full border-2 border-slate-200" />
									<div className="absolute inset-0 w-12 h-12 rounded-full border-t-2 border-blue-500 animate-spin" />
								</div>
								<p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
									Fetching records...
								</p>
							</div>
						) : accountsArray.length > 0 ? (
							<div className="space-y-3">
								{accountsArray.map((account) => (
									<div key={account.accountId} className="rounded-xl border border-slate-100 p-4 bg-slate-50 space-y-2">
										<div className="flex items-center justify-between">
											<h4 className="font-black text-sm text-slate-800">{account.accountName}</h4>
											<Button
												size="sm"
												variant="outline"
												className="h-7 text-[10px] font-black uppercase border-blue-200 text-blue-600 hover:bg-blue-50"
												onClick={() => {
													setFormOpen(true)
													setSelectedAccount(account?.accountId)
												}}
											>
												<UserPlus className="w-3 h-3 mr-1.5" />
												Add Member
											</Button>
										</div>
										{/* Replace the member mapping section inside your accountsArray.map with this: */}

										<div className="mt-3">
											<Accordion type="single" collapsible className="w-full">
												<AccordionItem value="members" className="border-none">
													<AccordionTrigger className="py-2 hover:no-underline group">
														<div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 group-hover:text-blue-600 transition-colors">
															<Users className="w-3 h-3" />
															<span>View {account.members?.length || 0} Members</span>
														</div>
													</AccordionTrigger>

													<AccordionContent className="pt-1 pb-3">
														<div className="space-y-1 pl-2 border-l-2 border-slate-100 ml-1.5">
															{account.members?.map((m: any) => (
																<div
																	key={m.memberId}
																	className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white hover:shadow-sm transition-all group/item"
																>
																	<div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover/item:bg-blue-400 transition-colors" />
																	<span className="text-xs font-medium text-slate-600 group-hover/item:text-slate-900">
																		{m.memberFirstName} {m.memberLastName}
																	</span>
																</div>
															))}

															{(!account.members || account.members.length === 0) && (
																<p className="text-[10px] text-slate-400 italic pl-2">No members assigned.</p>
															)}
														</div>
													</AccordionContent>
												</AccordionItem>
											</Accordion>
										</div>
									</div>
								))}
								{selectedAccount && <AddMemberModal
									isOpen={formOpen}
									onClose={() => {
										setFormOpen(false)
									}}
									onSaved={() => {
										setRefreshKey(k => k + 1)
									}}
									accountId={selectedAccount}
								/>}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center h-48 text-center space-y-3">
								<div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
									<Users className="w-7 h-7 text-slate-300" />
								</div>
								<div>
									<h3 className="text-slate-800 font-black text-sm uppercase tracking-tight">
										No Relations Found
									</h3>
									<p className="text-slate-400 text-xs mt-1 max-w-[220px] mx-auto">
										This member isn't linked to any other accounts yet.
									</p>
								</div>
								<Button
									size="sm"
									variant="outline"
									className="mt-2 border-blue-200 text-blue-600 hover:bg-blue-50 text-[10px] font-black uppercase h-8 px-4"
									onClick={() => toast({ title: "Note", description: "Redirecting to linking form..." })}
								>
									<UserPlus className="w-3 h-3 mr-1.5" />
									Link an Account
								</Button>
							</div>
						)}
					</div>

					<div className="flex justify-end px-5 py-3 border-t border-slate-100">
						<Button
							size="sm"
							variant="ghost"
							className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 h-7 px-3"
							onClick={() => setOpenShowFamily(false)}
						>
							Close
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}