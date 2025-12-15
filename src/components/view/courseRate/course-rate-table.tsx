import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getCourseRates, deleteCourseRate } from "@/api/courseRate.api";
import type { CourseRate } from "@/types/courseRate";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";

type Props = {
	onView?: (row: CourseRate) => void;
	onEdit?: (row: CourseRate) => void;
	refreshKey?: number;
	filterCourseId?: number; // Optional prop to filter strictly by course
};

export default function CourseRateTable({
	onView,
	onEdit,
	refreshKey,
	filterCourseId
}: Props) {
	const [data, setData] = useState<CourseRate[]>([]);
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [total, setTotal] = useState(0);

	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState<
		Record<string, string | number | undefined>
	>({});
	const [sortBy, setSortBy] = useState<keyof CourseRate>("courseRateId");
	const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [deleteOpen, setDeleteOpen] = useState(false);

	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			const res: Response<CourseRate[]> = await getCourseRates({
				page,
				limit,
				search: search || undefined,
				sortBy,
				sortOrder,
				courseId: filterCourseId,
				entityType: filters.entityType as string | undefined,
				courseName: filters.courseName as string | undefined
			});

			setData(res.data ?? []);
			setTotal(res.pagination?.total ?? 0);
		} catch {
			toast({ title: "Failed to load rates", variant: "destructive" });
			setData([]);
		} finally {
			setLoading(false);
		}
	}, [page, limit, search, sortBy, sortOrder, filterCourseId, filters]);

	const handleFilterChange = async (filterKey: string, value: string | number | undefined) => {
		setFilters((prev) => ({ ...prev, [filterKey]: value || undefined }));
		setPage(1);
	}

	useEffect(() => {
		loadData();
	}, [loadData, refreshKey]);

	useEffect(() => {
		setPage(1);
	}, [filterCourseId]);

	const columns: Column<CourseRate>[] = [
		{ header: "Entity Type", key: "entityType", sortable: true, filterType: "text" },
		{ header: "Course Name", key: "courseName", sortable: true, filterType: "text" },
		{
			header: "Rate",
			key: "unitRate",
			render: (r) => `₹${r.unitRate}`,
			sortable: true
		},
		{ header: "Above Units", key: "aboveUnits", sortable: true },
		{ header: "Freezing", key: "freezing", sortable: true },
		{
			header: "Effective Date",
			key: "introduceDate",
			render: (r) => new Date(r.introduceDate).toLocaleDateString(),
			sortable: true,
		},
		{
			header: "Changable",
			key: "changable",
			render: (r) => (r.changable ? "Yes" : "No"),
			sortable: true
		},
	];

	return (
		<>
			<DataTable<CourseRate>
				data={data}
				columns={columns}
				isLoading={loading}
				pagination={{
					page,
					limit,
					total,
					onPageChange: setPage,
				}}
				onSearchChange={(q) => {
					setSearch(q);
					setPage(1);
				}}
				onSortChange={(c, d) => {
					setSortBy(c as keyof CourseRate);
					setSortOrder(d);
				}}
				onView={onView}
				onEdit={onEdit}
				onDelete={(id) => {
					setDeleteId(id ?? null);
					setDeleteOpen(true);
				}}
				onFilterChange={handleFilterChange}
				idKey="courseRateId"
			/>

			<ConfirmDialog
				isOpen={deleteOpen}
				onClose={() => setDeleteOpen(false)}
				title="Delete Rate?"
				description="This will permanently delete this pricing configuration."
				confirmText="Delete"
				variant="destructive"
				onConfirm={async () => {
					if (!deleteId) return;
					await deleteCourseRate(deleteId);
					toast({ title: "Rate deleted" });
					setDeleteOpen(false);
					loadData();
				}}
			/>
		</>
	);
}