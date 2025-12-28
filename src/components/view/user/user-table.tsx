import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";

// Assuming these API functions exist based on previous backend work
import { getUsers, deleteUser } from "@/api/user.api";
import type { User } from "@/types/user";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge"; // Assuming you have a shadcn Badge component
import { User as UserIcon, Mail, Shield } from "lucide-react";

type Props = {
	onView?: (row: User) => void;
	onEdit?: (row: User) => void;
	refreshKey?: number;
};

export default function UserTable({ onView, onEdit, refreshKey }: Props) {
	const [data, setData] = useState<User[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	// Pagination states
	const [page, setPage] = useState<number>(1);
	const [limit] = useState<number>(10);
	const [total, setTotal] = useState<number>(0);

	// Filter/Sort states
	const [search, setSearch] = useState<string>("");
	const [filters, setFilters] = useState<
		Record<string, string | number | undefined>
	>({});
	const [sortBy, setSortBy] = useState<string>("userId");
	const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

	// Data Fetching
	const loadData = useCallback(async () => {
		try {
			setIsLoading(true);
			const res = await getUsers({
				page,
				limit,
				sortBy,
				sortOrder,
				search: search || undefined,
				role: filters.role as string | undefined,
				// memberId: filters.memberId as number | undefined,
			});

			const rowsRaw = Array.isArray(res)
				? res
				: Array.isArray(res?.data)
					? (res.data as User[])
					: [];

			setTotal(res.pagination.total);

			const rows = rowsRaw.map((r) => ({
				...r,
				// Ensure dates are Date objects for proper formatting
				lastLogin: r.lastLogin ? new Date(r.lastLogin) : undefined,
				createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
				updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
			})) as User[];

			setData(rows);
		} catch (err) {
			console.error("Failed to fetch users", err);
			toast({
				title: "Error",
				description: "Failed to load user data.",
				variant: "destructive",
			});
			setData([]);
		} finally {
			setIsLoading(false);
		}
	}, [page, limit, sortBy, sortOrder, search, filters]);

	useEffect(() => {
		loadData();
	}, [loadData, refreshKey]);

	// Handlers
	const handleSearchChange = (q: string) => {
		setSearch(q);
		setPage(1);
	};

	const handleFilterChange = (
		filterKey: string,
		value: string | number | undefined
	) => {
		setFilters((prev) => ({
			...prev,
			[filterKey]: value || undefined,
		}));
		setPage(1);
	};

	const handleSortChange = (column: string, direction: "ASC" | "DESC") => {
		setSortBy(column);
		setSortOrder(direction);
		setPage(1);
	};

	const handlePageChange = (p: number) => setPage(p);

	// Export handler
	const handleExport = async (): Promise<User[]> => {
		const res = await getUsers({
			page: 1,
			limit: total, // Fetch all for export
			sortBy,
			sortOrder,
			search: search || undefined,
			role: filters.role as string | undefined,
		});

		const rowsRaw = Array.isArray(res?.data) ? (res.data as User[]) : [];
		return rowsRaw.map((r) => ({
			...r,
			lastLogin: r.lastLogin ? new Date(r.lastLogin) : undefined,
			createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
		})) as User[];
	};

	// Delete states
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<number | null>(null);

	const handleDelete = async (id: number | undefined) => {
		if (id === undefined) return;

		try {
			await deleteUser(id);
			toast({
				title: "Success",
				description: "User deleted successfully",
			});
			setDeleteId(null);
			setDeleteOpen(false);
			await loadData();
		} catch {
			toast({
				title: "Error",
				description: "Failed to delete user",
				variant: "destructive",
			});
		}
	};

	// Column Definitions
	const columns: Column<User>[] = [
		{
			key: "username",
			header: "Username",
			sortable: true,
			filterType: "text",
			render: (r) => (
				<div className="flex items-center gap-2 font-medium">
					<UserIcon className="w-4 h-4 text-muted-foreground" />
					{r.username}
				</div>
			),
		},
		{
			key: "email",
			header: "Email",
			sortable: true,
			filterType: "text",
			render: (r) => (
				<div className="flex items-center gap-2 text-sm">
					<Mail className="w-4 h-4 text-muted-foreground" />
					{r.email}
				</div>
			),
		},
		{
			key: "role",
			header: "Role",
			sortable: true,
			filterType: "select",
			filterOptions: [
				{ label: "Admin", value: "admin" },
				{ label: "Staff", value: "staff" },
			],
			render: (r) => {
				const variant = r.role === "admin" ? "default" : "secondary";
				return (
					<Badge variant={variant} className="capitalize flex w-fit items-center gap-1">
						<Shield className="w-3 h-3" />
						{r.role}
					</Badge>
				);
			},
		},
		{
			key: "lastLogin",
			header: "Last Login",
			sortable: true,
			filterType: null,
			render: (r) =>
				r.lastLogin ? (
					<span className="text-sm text-muted-foreground">
						{new Date(r.lastLogin).toLocaleString()}
					</span>
				) : (
					<span className="text-sm text-muted-foreground">-</span>
				),
		},
		{
			key: "createdAt",
			header: "Created",
			sortable: true,
			filterType: null,
			render: (r) =>
				r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-",
		},
	];

	return (
		<div>
			<DataTable<User>
				data={data}
				columns={columns}
				isLoading={isLoading}
				pagination={{
					page,
					limit,
					total: total,
					onPageChange: handlePageChange,
				}}
				onSearchChange={handleSearchChange}
				onFilterChange={handleFilterChange}
				onSortChange={handleSortChange}
				onView={(row) => onView?.(row)}
				onEdit={(row) => onEdit?.(row)}
				onDelete={(id: number | undefined) => {
					setDeleteId(id ?? null);
					setDeleteOpen(true);
				}}
				idKey={"userId"}
				exportFileName="Users"
				onExport={handleExport}
			/>
			<ConfirmDialog
				isOpen={deleteOpen}
				onClose={() => {
					setDeleteOpen(false);
					setDeleteId(null);
				}}
				onConfirm={() => handleDelete(deleteId ?? undefined)}
				title="Delete User?"
				description="Are you sure you want to delete this user? This action cannot be undone and they will lose access immediately."
				confirmText="Delete User"
				cancelText="Cancel"
				variant="destructive"
			/>
		</div>
	);
}