import { useState, useRef, useEffect } from "react"
import { Check, ChevronsUpDown, Users, MapPin, Phone, Mail, Calendar } from "lucide-react"
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
import type { Member } from "@/types/member"
import { getMembers } from "@/api/member.api"

export function MemberTab({
	data,
	onUpdate,
}: {
	data?: Member
	onUpdate: (m: Member) => void
}) {
	const [open, setOpen] = useState(false)
	const [members, setMembers] = useState<Member[]>([])
	const [selectedMember, setSelectedMember] = useState<Member | null>(data || null)
	const [loading, setLoading] = useState(false)

	const debounceRef = useRef<NodeJS.Timeout | null>(null)

	const fetchMembersDebounced = (query: string) => {
		if (!query || query.trim().length < 2) {
			setMembers([])
			return
		}

		if (debounceRef.current) {
			clearTimeout(debounceRef.current)
		}

		debounceRef.current = setTimeout(async () => {
			setLoading(true)
			try {
				const response = await getMembers({
					search: query,
					limit: 50,
				})
				setMembers(response.data || [])
			} catch (err) {
				console.error("Member search failed", err)
			} finally {
				setLoading(false)
			}
		}, 400)
	}

	useEffect(() => {
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current)
			}
		}
	}, [])

	return (
		<div className="space-y-6 max-w-2xl mx-auto">
			<div className="space-y-2">
				<label className="text-sm font-medium">Select Member</label>

				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							role="combobox"
							className="w-full justify-between h-12"
						>
							{selectedMember?.memberId
								? `${selectedMember.memberFirstName} ${selectedMember.memberLastName}`
								: "Search by name, email or phone..."}
							<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</PopoverTrigger>

					<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
						<Command shouldFilter={false}>
							<CommandInput
								placeholder="Search..."
								onValueChange={fetchMembersDebounced}
							/>

							<CommandList>
								<CommandEmpty>
									{loading ? "Searching..." : "No member found."}
								</CommandEmpty>

								<CommandGroup>
									{members.map((member) => (
										<CommandItem
											key={member.memberId}
											onSelect={() => {
												setSelectedMember(member)
												onUpdate(member)
												setOpen(false)
											}}
										>
											<Check
												className={`mr-2 h-4 w-4 ${selectedMember?.memberId === member.memberId
														? "opacity-100"
														: "opacity-0"
													}`}
											/>
											<div>
												<p>
													{member.memberFirstName} {member.memberLastName}
												</p>
												<p className="text-xs text-muted-foreground">
													{member.contactNumber || member.email}
												</p>
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
				<Card className="p-6 border-2 border-primary/20 bg-muted/30">
					<div className="flex justify-between items-start mb-4">
						<div className="flex items-center gap-3">
							<div className="bg-primary/10 rounded-full">
								{selectedMember.avatar ? (
									<img
										src={`${import.meta.env.VITE_APP_R2_PUBLIC_ENDPOINT}/${selectedMember.avatar}`}
										alt="Avatar"
										className="w-16 h-16 rounded-full"
									/>
								) : (
									<Users className="w-16 h-16 text-primary p-3" />
								)}
							</div>

							<div>
								<h3 className="text-xl font-bold">
									{selectedMember.memberFirstName}{" "}
									{selectedMember.memberLastName}
								</h3>
								<Badge
									variant={
										selectedMember.status === "active"
											? "default"
											: "destructive"
									}
								>
									{selectedMember.status}
								</Badge>
							</div>
						</div>

						<div className="text-right">
							<p className="text-xs text-muted-foreground">Member ID</p>
							<p className="font-mono font-bold">
								#{selectedMember.memberId}
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<DetailItem
							icon={<Mail className="w-4 h-4" />}
							label="Email"
							value={selectedMember.email || "N/A"}
						/>
						<DetailItem
							icon={<Phone className="w-4 h-4" />}
							label="Phone"
							value={selectedMember.contactNumber || "N/A"}
						/>
						<DetailItem
							icon={<Calendar className="w-4 h-4" />}
							label="DOB"
							value={
								selectedMember.dob
									? new Date(selectedMember.dob).toLocaleDateString()
									: "N/A"
							}
						/>
						<DetailItem
							icon={<MapPin className="w-4 h-4" />}
							label="Location"
							value={`${selectedMember.city || ""} ${selectedMember.state || ""}`}
						/>
					</div>

					<div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center">
						<div>
							<p className="text-[10px] text-muted-foreground uppercase">
								Blood Group
							</p>
							<p className="font-medium">
								{selectedMember.bloodGroup || "N/A"}
							</p>
						</div>
						<div>
							<p className="text-[10px] text-muted-foreground uppercase">
								Gender
							</p>
							<p className="font-medium capitalize">
								{selectedMember.gender}
							</p>
						</div>
						<div>
							<p className="text-[10px] text-muted-foreground uppercase">
								Mother Tongue
							</p>
							<p className="font-medium">
								{selectedMember.mothertongue || "N/A"}
							</p>
						</div>
					</div>
				</Card>
			)}
		</div>
	)
}

function DetailItem({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode
	label: string
	value: string
}) {
	return (
		<div className="flex items-center gap-2">
			<div className="text-muted-foreground">{icon}</div>
			<div>
				<p className="text-[10px] text-muted-foreground uppercase mb-1">
					{label}
				</p>
				<p className="text-sm font-semibold">{value}</p>
			</div>
		</div>
	)
}
