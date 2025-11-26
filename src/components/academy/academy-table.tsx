import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";

import { getAcademies, deleteAcademy } from "@/api/academy.api";
import type { Academy } from "@/types/academy";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

type Props = {
  onView?: (row: Academy) => void;
  onEdit?: (row: Academy) => void;
  refreshKey?: number;
};

export default function AcademyTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<Academy[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, string | number | undefined>>({});
  const [sortBy, setSortBy] = useState<string>("academyId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getAcademies({
        page,
        limit,
        sortBy,
        sortOrder: sortOrder,
        search: search || undefined,
        academyName: filters.academyName as string | undefined,
        academyType: filters.academyType as string | undefined,
      });

      const rowsRaw = Array.isArray(res) ? res : (Array.isArray((res as Record<string, unknown>)?.data) ? (res as Record<string, unknown>).data as Academy[] : []);
      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
        registrationDate: r.registrationDate ? new Date(r.registrationDate) : undefined,
        discontinuedDate: r.discontinuedDate ? new Date(r.discontinuedDate) : undefined,
      })) as Academy[];

      setData(rows);
    } catch (err) {
      console.error("Failed to fetch academies", err);
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

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const columns: Column<Academy>[] = [
    {
      key: "academyName",
      header: "Academy Name",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.academyName}</span>
        </div>
      ),
    },
    {
      key: "academyType",
      header: "Type",
      sortable: true,
      filterType: null,
      render: (r) => <span className="text-sm">{r.academyType || "-"}</span>,
    },
    {
      key: "email",
      header: "Email",
      sortable: false,
      filterType: null,
      render: (r) => <span className="text-sm">{r.email || "-"}</span>,
    },
    {
      key: "contactNumber",
      header: "Contact",
      sortable: false,
      filterType: null,
      render: (r) => <span className="text-sm">{r.contactNumber || "-"}</span>,
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      filterType: null,
      render: (r) =>
        r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US") : "-",
    },
  ];

  const handleDelete = async (id: number | undefined) => {
    if (id === undefined) return;

    try {
      await deleteAcademy(id);
      toast({
        title: "Success",
        description: "Academy deleted successfully",
      });
      setDeleteId(null);
      setDeleteOpen(false);
      await loadData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete academy",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <DataTable<Academy>
        data={data}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          limit,
          total: data.length,
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
        idKey={"academyId"}
      />
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={() => handleDelete(deleteId ?? undefined)}
        title="Delete Academy?"
        description="Are you sure you want to delete this academy? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
