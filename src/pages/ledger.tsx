import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getLedgerEntriesByAccount } from '@/api/transaction.api';
import { getAccounts, type AccountQuery } from '@/api/account.api';
import {
	ArrowDownRight,
	ArrowUpRight,
	Wallet,
	Loader2,
	ArrowRightLeft,
	FileText,
	Check,
	ChevronsUpDown
} from 'lucide-react';

// shadcn components
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';

// Utility for class merging (standard in shadcn)
import { cn } from '@/lib/utils';

// Types
import type { Response } from '@/types/response';
import type { Account } from '@/types/account';
import type { Transaction } from '@/types/transaction';
import { format } from 'date-fns';

const Ledger = () => {
	// --- State ---
	const [selectedAccountId, setSelectedAccountId] = useState("");
	const [ledgerEntries, setLedgerEntries] = useState<Transaction[]>([]);
	const [loadingLedger, setLoadingLedger] = useState(false);

	// --- Combobox & Pagination State ---
	const [open, setOpen] = useState(false);
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [isFetchingAccounts, setIsFetchingAccounts] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);

	// --- 1. Debounce Search Input ---
	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchTerm !== debouncedSearch) {
				setAccounts([]);
				setPage(1);
				setHasMore(true);
				setDebouncedSearch(searchTerm);
			}
		}, 500);
		return () => clearTimeout(timer);
	}, [searchTerm, debouncedSearch]);

	// --- 2. Fetch Accounts (Infinite Scroll + Search) ---
	useEffect(() => {
		let isMounted = true;

		const fetchAccountList = async () => {
			if (!hasMore && page !== 1) return;

			setIsFetchingAccounts(true);
			try {
				const queryParams: AccountQuery = {
					limit: 20,
					page: page,
					...(debouncedSearch ? { search: debouncedSearch } : {}),
				};

				const response: Response<Account[]> = await getAccounts(queryParams);
				if (!isMounted) return;

				const accountData = response?.data || response;
				const newAccounts = Array.isArray(accountData) ? accountData : [];

				setAccounts(prev => (page === 1 ? newAccounts : [...prev, ...newAccounts]));
				setHasMore(newAccounts.length === 20);
			} catch (error) {
				console.error("Failed to fetch accounts:", error);
			} finally {
				if (isMounted) setIsFetchingAccounts(false);
			}
		};

		// Only fetch if the combobox is open to save unnecessary network requests
		if (open) {
			fetchAccountList();
		}

		return () => {
			isMounted = false;
		};
	}, [page, debouncedSearch, open]);

	// --- 3. Intersection Observer for Infinite Scrolling ---
	const observer = useRef<IntersectionObserver | null>(null);
	const lastAccountElementRef = useCallback((node: HTMLDivElement) => {
		if (isFetchingAccounts) return;
		if (observer.current) observer.current.disconnect();

		observer.current = new IntersectionObserver(entries => {
			if (entries[0].isIntersecting && hasMore) {
				setPage(prevPage => prevPage + 1);
			}
		});

		if (node) observer.current.observe(node);
	}, [isFetchingAccounts, hasMore]);

	// --- 4. Fetch Ledger Entries ---
	useEffect(() => {
		if (!selectedAccountId) {
			setLedgerEntries([]);
			return;
		}

		const fetchEntries = async () => {
			setLoadingLedger(true);
			try {
				const response: Response<Transaction[]> = await getLedgerEntriesByAccount(Number(selectedAccountId));
				if (response?.success) {
					setLedgerEntries(response?.data || []);
				}
			} catch (error) {
				console.error("Failed to fetch ledger entries:", error);
			} finally {
				setLoadingLedger(false);
			}
		};

		fetchEntries();
	}, [selectedAccountId]);

	// --- 5. Calculate Ledger Totals ---
	const { totalDebit, totalCredit, closingBalance, balanceType } = useMemo(() => {
		let debit = 0;
		let credit = 0;

		ledgerEntries.forEach((entry: Transaction) => {
			const amount = parseFloat(entry?.amount as string) || 0;
			if (entry?.drAccountId?.toString() === selectedAccountId) {
				debit += amount;
			} else if (entry?.crAccountId?.toString() === selectedAccountId) {
				credit += amount;
			}
		});

		const diff = Math.abs(debit - credit);
		const type = debit > credit ? 'Dr' : credit > debit ? 'Cr' : '';

		return {
			totalDebit: debit,
			totalCredit: credit,
			closingBalance: diff,
			balanceType: type
		};
	}, [ledgerEntries, selectedAccountId]);

	// Find the selected account name for the button display
	const selectedAccountName = useMemo(() => {
		const found = accounts.find(acc => acc?.accountId?.toString() === selectedAccountId);
		return found ? found.accountName : "Select an account...";
	}, [selectedAccountId, accounts]);

	return (
		<div className="p-4 md:p-8 space-y-6 w-full max-w-7xl mx-auto">
			{/* Header & Account Selection Panel */}
			<div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-muted/30 p-6 rounded-xl border">
				<div>
					<h2 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-foreground">
						<Wallet className="h-8 w-8 text-primary" />
						Account Ledger
					</h2>
					<p className="text-muted-foreground mt-1">
						Search and select an account to view its transaction history.
					</p>
				</div>

				<div className="w-full md:w-[400px]">
					<label className="text-sm font-medium text-foreground mb-2 block">Target Account</label>
					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								role="combobox"
								aria-expanded={open}
								className="w-full justify-between bg-background border-primary hover:bg-background/90"
							>
								<span className="truncate">
									{selectedAccountName}
								</span>
								<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-[400px] p-0" align="end">
							{/* shouldFilter={false} is critical here so cmdk doesn't override our API search */}
							<Command shouldFilter={false}>
								<CommandInput
									placeholder="Search by account name..."
									value={searchTerm}
									onValueChange={setSearchTerm}
								/>
								<CommandList>
									<CommandEmpty>
										{isFetchingAccounts ? "Searching..." : "No accounts found."}
									</CommandEmpty>
									<CommandGroup>
										{accounts.map((acc: Account) => (
											<CommandItem
												key={acc.accountId}
												value={acc?.accountId?.toString()}
												onSelect={(currentValue) => {
													setSelectedAccountId(currentValue === selectedAccountId ? "" : currentValue);
													setOpen(false);
												}}
											>
												<Check
													className={cn(
														"mr-2 h-4 w-4",
														selectedAccountId === acc?.accountId?.toString() ? "opacity-100" : "opacity-0"
													)}
												/>
												<div className="flex flex-row items-center gap-2">
													<span>{acc.accountName}</span>
													<span className="text-xs text-muted-foreground">ID: {acc.accountId}</span>
												</div>
											</CommandItem>
										))}

										{/* Scroll Sentinel for Infinite Fetching */}
										<div ref={lastAccountElementRef} className="h-1" />

										{isFetchingAccounts && (
											<div className="flex items-center justify-center p-4">
												<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
											</div>
										)}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				</div>
			</div>

			{/* Content Area */}
			{!selectedAccountId ? (
				<Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-muted/10">
					<ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
					<h3 className="text-lg font-medium text-foreground">No Account Selected</h3>
					<p className="text-muted-foreground mt-1">
						Use the dropdown above to search and select an account.
					</p>
				</Card>
			) : (
				<div className="space-y-6 animate-in fade-in duration-500">
					{/* Summary Cards */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Total Debit (Dr)</CardTitle>
								<ArrowUpRight className="h-4 w-4 text-rose-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-foreground">
									{loadingLedger ? (
										<Skeleton className="h-8 w-24" />
									) : (
										totalDebit.toLocaleString("en-IN", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})
									)}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Total Credit (Cr)</CardTitle>
								<ArrowDownRight className="h-4 w-4 text-emerald-500" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-foreground">
									{/* {loadingLedger ? <Skeleton className="h-8 w-24" /> : totalCredit.toFixed(2)} */}
									<div className="text-2xl font-bold text-foreground">
									{loadingLedger ? (
										<Skeleton className="h-8 w-24" />
									) : (
										totalCredit.toLocaleString("en-IN", {
											minimumFractionDigits: 2,
											maximumFractionDigits: 2,
										})
									)}
								</div>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Closing Balance</CardTitle>
								<Wallet className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-foreground flex items-center gap-2">
									{loadingLedger ? (
										<Skeleton className="h-8 w-32" />
									) : (
										<>
											{/* {closingBalance.toFixed(2)} */}
											{closingBalance.toLocaleString("en-IN", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
											{balanceType && (
												<Badge variant="secondary" className="text-xs">
													{balanceType}
												</Badge>
											)}
										</>
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Table Card */}
					<Card>
						<CardHeader>
							<CardTitle>Transactions</CardTitle>
							<CardDescription>
								A detailed view of all debits and credits for the selected account.
							</CardDescription>
						</CardHeader>
						<CardContent>
							{loadingLedger ? (
								<div className="flex justify-center p-12">
									<Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
								</div>
							) : ledgerEntries.length === 0 ? (
								<div className="text-center py-16 text-muted-foreground flex flex-col items-center">
									<FileText className="h-12 w-12 mb-4 opacity-20" />
									<p className="text-lg font-medium">No transactions found</p>
									<p className="text-sm">There are no ledger entries associated with this account.</p>
								</div>
							) : (
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow className="bg-muted/50">
												<TableHead>Date</TableHead>
												<TableHead>Type</TableHead>
												<TableHead>Particulars</TableHead>
												<TableHead>Source/Ref</TableHead>
												<TableHead className="text-right">Debit (Dr)</TableHead>
												<TableHead className="text-right">Credit (Cr)</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{ledgerEntries.map((entry: Transaction, idx: number) => {
												const amount = parseFloat(entry?.amount as string) || 0;
												const isDebit = entry.drAccountId?.toString() === selectedAccountId;
												const isCredit = entry.crAccountId?.toString() === selectedAccountId;
												const opposingAccount = isDebit ? entry.crAccountName : entry.drAccountName;

												return (
													<TableRow key={idx} className="hover:bg-muted/50 transition-colors">
														<TableCell className="whitespace-nowrap text-muted-foreground">
															{entry?.createdAt ? format(new Date(entry.createdAt), 'dd MMM yyyy') : '-'}
														</TableCell>
														<TableCell>
															<Badge variant="outline" className="capitalize">
																{entry.transactionType}
															</Badge>
														</TableCell>
														<TableCell className="font-medium">
															{opposingAccount?.trim() || 'Unknown Account'}
														</TableCell>
														<TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
															{entry.formReferenceNo + " " + entry.entrySource || '-'}
														</TableCell>
														<TableCell className={`text-right font-medium ${isDebit ? 'text-rose-500' : 'text-muted-foreground'}`}>
															{isDebit ? amount.toFixed(2) : '-'}
														</TableCell>
														<TableCell className={`text-right font-medium ${isCredit ? 'text-emerald-500' : 'text-muted-foreground'}`}>
															{isCredit ? amount.toFixed(2) : '-'}
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
										<TableFooter className="bg-muted/50">
											<TableRow>
												<TableCell colSpan={4} className="text-right font-bold text-foreground">
													Totals
												</TableCell>
												<TableCell className="text-right font-bold text-rose-500 text-base">
													{totalDebit.toFixed(2)}
												</TableCell>
												<TableCell className="text-right font-bold text-emerald-500 text-base">
													{totalCredit.toFixed(2)}
												</TableCell>
											</TableRow>
										</TableFooter>
									</Table>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
};

export default Ledger;