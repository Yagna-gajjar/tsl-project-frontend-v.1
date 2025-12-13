import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { getAccounts } from "@/api/account.api";
import { getMembers } from "@/api/member.api";
import { bulkAccountMember } from "@/api/accountMember.api";

import type { Account } from "@/types/account";
import type { Member } from "@/types/member";
import type { Response } from "@/types/response";
import { toast } from "@/hooks/use-toast";
import { Search, X, ChevronDown, ChevronUp, UserPlus, Users } from "lucide-react";
import type { AccountMember } from "@/types/accountMember";

type Props = {
	isOpen: boolean;
	onClose: () => void;
};

type MemberSearchParams = {
	name: string;
	address: string;
	contactNumber: string;
	ageGroup: string;
	personalStatus: string;
};

export default function AccountMemberBulkFormModal({ isOpen, onClose }: Props) {
	const [accountId, setAccountId] = useState<string>("");
	const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

	const [relationship, setRelationship] = useState<string>("");
	const [linkBilling, setLinkBilling] = useState<boolean>(false);

	const [showFilters, setShowFilters] = useState(false);

	const [searchParams, setSearchParams] = useState<MemberSearchParams>({
		name: "",
		address: "",
		contactNumber: "",
		ageGroup: "",
		personalStatus: "",
	});

	const [debouncedParams, setDebouncedParams] = useState<MemberSearchParams>(searchParams);

	const [accountOptions, setAccountOptions] = useState<Account[]>([]);
	const [memberOptions, setMemberOptions] = useState<Member[]>([]);

	const [isLoadingMembers, setIsLoadingMembers] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const firstRender = useRef(true);

	useEffect(() => {
		if (!isOpen) return;

		const loadAccounts = async () => {
			try {
				const accRes: Response<Account[]> = await getAccounts({ page: 1, limit: 1000 });
				setAccountOptions(accRes.data as Account[]);
			} catch (error) {
				console.error("Failed to load accounts", error);
			}
		};

		loadAccounts();

		setAccountId("");
		setSelectedMemberIds([]);
		setRelationship("");
		setLinkBilling(false);
		setSearchParams({ name: "", address: "", contactNumber: "", ageGroup: "", personalStatus: "" });
		setDebouncedParams({ name: "", address: "", contactNumber: "", ageGroup: "", personalStatus: "" });

		fetchMembers({ name: "", address: "", contactNumber: "", ageGroup: "", personalStatus: "" });

	}, [isOpen]);

	useEffect(() => {
		if (firstRender.current) {
			firstRender.current = false;
			return;
		}

		const handler = setTimeout(() => {
			setDebouncedParams(searchParams);
		}, 500);

		return () => {
			clearTimeout(handler);
		};
	}, [searchParams]);

	useEffect(() => {
		if (!isOpen) return;
		fetchMembers(debouncedParams);
	}, [debouncedParams]);


	const fetchMembers = async (params: MemberSearchParams) => {
		setIsLoadingMembers(true);
		try {
			const memRes: Response<Member[]> = await getMembers({
				page: 1,
				limit: 100,
				memberFirstName: params.name,
				personalStatus: params.personalStatus,
				age: params.ageGroup,
				contactNumber: params.contactNumber
			});
			setMemberOptions(memRes.data as Member[]);
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoadingMembers(false);
		}
	};

	const handleSearchChange = (field: keyof MemberSearchParams, value: string) => {
		setSearchParams(prev => ({ ...prev, [field]: value }));
	};

	const handleMemberToggle = (id: number) => {
		setSelectedMemberIds((prev) =>
			prev.includes(id)
				? prev.filter((item) => item !== id)
				: [...prev, id]
		);
	};

	const visibleSelectedMembers = memberOptions.filter(m => selectedMemberIds.includes(m.memberId));

	const handleSubmit = async () => {
		if (!accountId) {
			toast({ title: "Validation", description: "Please select an Account", variant: "destructive" });
			return;
		}
		if (selectedMemberIds.length === 0) {
			toast({ title: "Validation", description: "Please select at least one Member", variant: "destructive" });
			return;
		}

		setIsSubmitting(true);

		const membersPayload = selectedMemberIds.map(id => ({
			memberId: id,
			relationship: relationship,
			linkBilling: linkBilling
		}));

		const finalPayload = {
			accountId: Number(accountId),
			members: membersPayload
		};
		const res: Response<AccountMember> = await bulkAccountMember(finalPayload as any);
		if (res?.success) {
			setTimeout(() => {
				setIsSubmitting(false);
				onClose();
				toast({
					title: "Success",
					description: "Member Linked Successfully.",
					variant: "success"
				});
			}, 300);
		}
		else {
			toast({
				title: "Error",
				description: "Failed to link Members.",
				variant: "destructive"
			});
		}
	};

	if (!isOpen) return null;

	return (
		<Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-5xl p-0 gap-0 bg-background overflow-hidden h-[90vh] flex flex-col rounded-xl border shadow-xl">

				<FormHeader title="Link Members to Account" onClose={onClose} />

				<div className="flex flex-1 overflow-hidden">

					<div className="flex-[2] flex flex-col border-r h-full overflow-hidden">

						<div className="p-4 border-b space-y-3 bg-muted/5">
							<div className="relative">
								<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search by name..."
									className="pl-9 bg-background"
									value={searchParams.name}
									onChange={(e) => handleSearchChange('name', e.target.value)}
								/>
							</div>

							<div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowFilters(!showFilters)}
									className="text-xs text-muted-foreground hover:text-primary p-0 h-auto flex items-center gap-1"
								>
									{showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
									{showFilters ? "Hide Filters" : "Advanced Filters"}
								</Button>

								{showFilters && (
									<div className="grid grid-cols-2 gap-3 pt-3 animate-in slide-in-from-top-2 duration-200">
										<Input
											placeholder="Contact No..."
											className="h-8 text-sm bg-background"
											value={searchParams.contactNumber}
											onChange={(e) => handleSearchChange('contactNumber', e.target.value)}
										/>
										<Input
											placeholder="Age Group..."
											className="h-8 text-sm bg-background"
											value={searchParams.ageGroup}
											onChange={(e) => handleSearchChange('ageGroup', e.target.value)}
										/>
										<Input
											placeholder="Personal Status..."
											className="h-8 text-sm bg-background"
											value={searchParams.personalStatus}
											onChange={(e) => handleSearchChange('personalStatus', e.target.value)}
										/>
									</div>
								)}
							</div>
						</div>

						<ScrollArea className="flex-1 bg-background/50">
							<div className="p-2">
								{isLoadingMembers ? (
									<div className="space-y-2 p-2">
										{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/40 animate-pulse rounded-md" />)}
									</div>
								) : memberOptions.length === 0 ? (
									<div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
										<Users className="h-8 w-8 mb-2 opacity-20" />
										No members found.
									</div>
								) : (
									<div className="space-y-1">
										{memberOptions.map((member) => {
											const isSelected = selectedMemberIds.includes(member.memberId);
											return (
												<div
													key={member.memberId}
													onClick={() => handleMemberToggle(member.memberId)}
													className={`
                                                group flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200
                                                ${isSelected
															? "bg-primary/5 border-primary/30 shadow-sm"
															: "bg-card border-transparent hover:bg-muted/50 hover:border-border"
														}
                                            `}
												>
													<Checkbox
														checked={isSelected}
														onCheckedChange={() => handleMemberToggle(member.memberId)}
														className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
													/>
													<div className="flex-1 min-w-0">
														<div className="flex justify-between items-center mb-0.5">
															<span className={`font-medium text-sm truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
																{member.memberFirstName} {member.memberLastName}
															</span>
															{member.personalStatus && (
																<Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground uppercase">
																	{member.personalStatus}
																</Badge>
															)}
														</div>
														<div className="flex gap-3 text-xs text-muted-foreground truncate">
															<span className="flex items-center gap-1">
																{member.contactNumber || 'No Contact'}
															</span>
															{member.line1 && <span className="opacity-50">•</span>}
															<span className="truncate">{member.line1}</span>
														</div>
													</div>
												</div>
											)
										})}
									</div>
								)}
							</div>
						</ScrollArea>

						<div className="p-2 border-t bg-muted/10 text-xs text-center text-muted-foreground">
							Showing {memberOptions.length} results
						</div>
					</div>

					<div className="flex-1 flex flex-col bg-muted/5 h-full">
						<ScrollArea className="flex-1">
							<div className="p-6 space-y-6">

								<div className="space-y-3">
									<Label className="text-sm font-semibold">Target Account</Label>
									<Select value={accountId} onValueChange={setAccountId}>
										<SelectTrigger className="bg-background shadow-sm">
											<SelectValue placeholder="Select Account" />
										</SelectTrigger>
										<SelectContent>
											{accountOptions.map((acc) => (
												<SelectItem key={acc.accountId} value={String(acc.accountId)}>
													{acc.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<Separator />

								<div className="space-y-4">
									<div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
										<UserPlus className="h-4 w-4" />
										<span>Bulk Settings</span>
									</div>

									<div className="space-y-2">
										<Label className="text-xs">Relationship (Optional)</Label>
										<Input
											placeholder="e.g. Employee, Family..."
											value={relationship}
											onChange={(e) => setRelationship(e.target.value)}
											className="bg-background h-9"
										/>
									</div>

									<div className="flex items-start space-x-3 p-3 border rounded-md bg-background shadow-sm">
										<Checkbox
											id="linkBilling"
											checked={linkBilling}
											onCheckedChange={(c) => setLinkBilling(c as boolean)}
											className="mt-0.5"
										/>
										<div className="grid gap-1 leading-none">
											<Label htmlFor="linkBilling" className="cursor-pointer font-medium">
												Link Billing
											</Label>
											<p className="text-xs text-muted-foreground">
												Allows members to use account credits.
											</p>
										</div>
									</div>
								</div>

								<Separator />

								<div className="space-y-3">
									<div className="flex justify-between items-center">
										<Label className="text-sm font-semibold">Selection</Label>
										<Badge variant="secondary" className="rounded-full px-2">
											{selectedMemberIds.length}
										</Badge>
									</div>

									<div className="min-h-[100px] max-h-[250px] overflow-y-auto pr-1">
										{selectedMemberIds.length === 0 ? (
											<div className="text-xs text-muted-foreground italic text-center py-8 border-2 border-dashed rounded-lg">
												No members selected yet
											</div>
										) : (
											<div className="flex flex-wrap gap-2">
												{visibleSelectedMembers.map(m => (
													<Badge
														key={m.memberId}
														variant="secondary"
														className="pl-2 pr-1 py-1 gap-1 flex items-center text-xs font-normal bg-white border shadow-sm"
													>
														<span className="truncate max-w-[100px]">{m.memberFirstName}</span>
														<button
															onClick={(e) => { e.stopPropagation(); handleMemberToggle(m.memberId); }}
															className="hover:bg-destructive hover:text-white rounded-full p-0.5 transition-colors"
														>
															<X className="h-3 w-3" />
														</button>
													</Badge>
												))}
												{selectedMemberIds.length > visibleSelectedMembers.length && (
													<span className="text-xs text-muted-foreground flex items-center px-1">
														+{selectedMemberIds.length - visibleSelectedMembers.length} hidden
													</span>
												)}
											</div>
										)}
									</div>
								</div>
							</div>
						</ScrollArea>
					</div>
				</div>

				<FormFooter
					onClose={onClose}
					onSubmit={handleSubmit}
					submitLabel={selectedMemberIds.length > 0 ? `Link ${selectedMemberIds.length} Members` : "Link Members"}
					isSubmitting={isSubmitting}
				/>
			</DialogContent>
		</Dialog>
	);
}