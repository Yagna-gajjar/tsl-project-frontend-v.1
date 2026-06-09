import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";

import { getTransactions, deleteTransaction } from "@/api/transaction.api";
import type { Transaction } from "@/types/transaction";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type Props = {
	onView?: (row: Transaction) => void;
	onEdit?: (row: Transaction) => void;
	onPrint?: (row: Transaction) => void;
	refreshKey?: number;
};

export default function TransactionTable({ onView, onEdit, onPrint, refreshKey }: Props) {
	const [data, setData] = useState<Transaction[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const [page, setPage] = useState<number>(1);
	const [limit] = useState<number>(10);
	const [total, setTotal] = useState<number>(0);

	const [search, setSearch] = useState<string>("");
	const [filters, setFilters] = useState<Record<string, string | number | undefined>>({});
	const [sortBy, setSortBy] = useState<string>("transactionId");
	const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

	const loadData = useCallback(async () => {
		try {
			setIsLoading(true);
			const res = await getTransactions({
				page,
				limit,
				sortBy,
				sortOrder,
				search: search || undefined,
				transactionType: filters.transactionType as string | undefined,
				status: filters.status as string | undefined,
			});

			const rows = (Array.isArray(res?.data) ? res.data : []) as Transaction[];
			setTotal(res.pagination?.total || 0);
			setData(rows);
		} catch (err) {
			console.error("Failed to fetch transactions", err);
			setData([]);
		} finally {
			setIsLoading(false);
		}
	}, [page, limit, sortBy, sortOrder, search, filters]);

	useEffect(() => {
		loadData();
	}, [loadData, refreshKey]);

	const handleSearchChange = (q: string) => {
		setSearch(q);
		setPage(1);
	};

	const handleFilterChange = (filterKey: string, value: string | number | undefined) => {
		setFilters((prev) => ({ ...prev, [filterKey]: value || undefined }));
		setPage(1);
	};

	const handleSortChange = (column: string, direction: "ASC" | "DESC") => {
		setSortBy(column);
		setSortOrder(direction);
		setPage(1);
	};

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<number | null>(null);

	const handleDelete = async (id: number | undefined) => {
		if (id === undefined) return;
		try {
			await deleteTransaction(id);
			toast({ title: "Success", description: "Transaction deleted successfully" });
			setDeleteOpen(false);
			loadData();
		} catch {
			toast({ title: "Error", description: "Failed to delete transaction", variant: "destructive" });
		}
	};

	const columns: Column<Transaction>[] = [
		{
			key: "transactionId",
			header: "ID",
			sortable: true,
			render: (r) => <span className="font-mono text-xs">#{r.transactionId}</span>,
		},
		{
			key: "transactionType",
			header: "Type",
			sortable: true,
			filterType: "text",
			render: (r) => (
				<Badge variant="outline" className="capitalize">
					{r.transactionType}
				</Badge>
			),
		},
		{
			key: "crAccountName",
			header: "Credit (From)",
			render: (r) => (
				<div className="flex flex-col">
					<span className="text-sm font-medium text-emerald-600">{r.crAccountName || "N/A"}</span>
					<span className="text-[10px] text-gray-400">{r.crMemberFirstName} {r.crMemberLastName}</span>
				</div>
			),
		},
		{
			key: "drAccountName",
			header: "Debit (To)",
			render: (r) => (
				<div className="flex flex-col">
					<span className="text-sm font-medium text-red-600">{r.drAccountName || "N/A"}</span>
					<span className="text-[10px] text-gray-400">{r.drMemberFirstName} {r.drMemberLastName}</span>
				</div>
			),
		},
		{
			key: "amount",
			header: "Amount",
			sortable: true,
			render: (r) => (
				<span className="font-bold">
					₹{Number(r.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
				</span>
			),
		},
		{
			key: "status",
			header: "Status",
			sortable: true,
			render: (r) => (
				<Badge className={r.status === 'active' ? "bg-green-500" : "bg-gray-400"}>
					{r.status}
				</Badge>
			),
		},
		{
			key: "createdAt",
			header: "Date",
			sortable: true,
			render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "-",
		},
	];

	return (
		<div>
			<DataTable<Transaction>
				data={data}
				columns={columns}
				isLoading={isLoading}
				pagination={{
					page,
					limit,
					total,
					onPageChange: (p: number) => setPage(p),
				}}
				onSearchChange={handleSearchChange}
				onFilterChange={handleFilterChange}
				onSortChange={handleSortChange}
				onView={onView}
				onEdit={onEdit}
				onDelete={(id) => {
					setDeleteId(id as number);
					setDeleteOpen(true);
				}}
				onPrint={onPrint}
				// onPrint={onPrint ? (row) => {
				// 	onPrint(row);
				// 	document?.querySelector('#depositSlip')?.scrollIntoView({ behavior: 'smooth' });
				// } : undefined}
				idKey="transactionId"
				exportFileName="Transactions"
				onExport={async () => data}
			/>
			<ConfirmDialog
				isOpen={deleteOpen}
				onClose={() => setDeleteOpen(false)}
				onConfirm={() => handleDelete(deleteId ?? undefined)}
				title="Delete Transaction?"
				description="Are you sure? This will permanently remove the financial record."
				variant="destructive"
			/>
		</div>
	);
}