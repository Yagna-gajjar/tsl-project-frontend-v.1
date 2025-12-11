import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getAcademyCoaches, deleteAcademyCoach } from "@/api/academyCoach.api";
import type { AcademyCoach } from "@/types/academyCoach";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

type Props = {
  onView?: (row: AcademyCoach) => void;
  onEdit?: (row: AcademyCoach) => void;
  refreshKey?: number;
};

export default function AcademyCoachTable({
  onView,
  onEdit,
  refreshKey,
}: Props) {
  const [data, setData] = useState<AcademyCoach[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<
    Record<string, string | number | undefined>
  >({});
  const [sortBy, setSortBy] = useState<string>("academyCoachesId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getAcademyCoaches({
        page,
        limit,
        sortBy,
        sortOrder: sortOrder,
        search: search || undefined,
        designation: filters.designation as string | undefined,
        academyName: filters.academyName as string | undefined,
        coachName: filters.coachName as string | undefined,
      });

      setTotal(res?.pagination.total);

      const rowsRaw = Array.isArray(res)
        ? res
        : Array.isArray((res as Record<string, unknown>)?.data)
        ? ((res as Record<string, unknown>).data as AcademyCoach[])
        : [];
      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r) => ({
        ...r,
        coachName: r.coachFirstName + " " + r.coachLastName,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
        joiningDate: r.joiningDate ? new Date(r.joiningDate) : undefined,
        relievedDate: r.relievedDate ? new Date(r.relievedDate) : undefined,
      })) as AcademyCoach[];

      setData(rows);
    } catch (err) {
      console.error("Failed to fetch academy coaches", err);
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
    if (column === "coachName") {
      column = "coachFirstName"; // Default sort by first name if coachName is selected
    }
    setSortBy(column);
    setSortOrder(direction);
    setPage(1);
  };

  const handlePageChange = (p: number) => setPage(p);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const columns: Column<AcademyCoach>[] = [
    {
      key: "coachName",
      header: "Coach Full Name",
      sortable: false,
      filterType: "text",
      render: (r) => <span className="font-medium">{r.coachName}</span>,
    },
    {
      key: "coachFirstName",
      header: "First Name",
      sortable: true,
      filterType: null,
      hidden: true,
      render: (r) => <span className="font-medium">{r.coachFirstName}</span>,
    },
    {
      key: "coachLastName",
      header: "Last Name",
      sortable: true,
      filterType: null,
      hidden: true,
      render: (r) => <span className="font-medium">{r.coachLastName}</span>,
    },
    {
      key: "academyName",
      header: "Academy Name",
      sortable: true,
      filterType: null,
      render: (r) => <span className="font-medium">{r.academyName}</span>,
    },
    {
      key: "designation",
      header: "Designation",
      sortable: true,
      filterType: "text",
      render: (r) => <span className="text-sm">{r.designation}</span>,
    },
    {
      key: "joiningDate",
      header: "Joining Date",
      sortable: true,
      filterType: null,
      render: (r) => (
        <span className="text-sm">
          {r.joiningDate ? new Date(r.joiningDate).toLocaleDateString() : "-"}
        </span>
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

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    try {
      await deleteAcademyCoach(id);
      toast({
        title: "Success",
        description: "Academy coach deleted successfully",
      });
      setDeleteOpen(false);
      await loadData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete academy coach",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <DataTable<AcademyCoach>
        data={data}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          limit,
          total,
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
        idKey={"academyCoachesId"}
      />
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={() => handleDelete(deleteId ?? undefined)}
        title="Delete Academy Coach?"
        description="Are you sure you want to delete this academy coach assignment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
