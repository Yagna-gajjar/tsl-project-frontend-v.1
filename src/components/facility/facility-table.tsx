import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { format } from "date-fns";

import { getFacilities, deleteFacility } from "@/api/facility.api";
import type { Facility } from "@/types/facility";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

type Props = {
  onView?: (row: Facility) => void;
  onEdit?: (row: Facility) => void;
  refreshKey?: number;
};

export default function FacilityTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, string | number | undefined>>({});
  const [sortBy, setSortBy] = useState<string>("facilityId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getFacilities({
        page,
        limit,
        sortBy,
        sortOrder: sortOrder,
        search: search || undefined,
        facilityName: filters.facilityName as string | undefined,
        facilityType: filters.facilityType as string | undefined,
      });

      const rowsRaw = Array.isArray(res) ? res : (Array.isArray((res as Record<string, unknown>)?.data) ? (res as Record<string, unknown>).data as Facility[] : []);
      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      })) as Facility[];

      setData(rows);
      const totalCount = rows.length ?? 0;
      setTotal(totalCount);
    } catch (err) {
      console.error("Failed to fetch facilities", err);
      setData([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const columns: Column<Facility>[] = [
    {
      key: "facilityName",
      header: "Facility Name",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.facilityName}</span>
        </div>
      ),
    },
    {
      key: "facilityType",
      header: "Facility Type",
      sortable: true,
      filterType: "text",
      render: (r) => r.facilityType ?? "-",
    },
    {
      key: "areaSQFT",
      header: "Area (SQFT)",
      sortable: true,
      filterType: "number",
      render: (r) => r.areaSQFT ?? "-",
    },
    {
      key: "academicCapacity",
      header: "Academic Capacity",
      sortable: true,
      filterType: "number",
      render: (r) => r.academicCapacity ?? "-",
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      filterType: null,
      render: (r) => (r.createdAt ? format(r.createdAt, "dd MMM yyyy") : "-"),
    },
  ];

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
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleDelete = (id: number | undefined) => {
    if (id === undefined || id === null) return;
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    try {
      setLoadingDelete(true);
      await deleteFacility(deleteId);
      await loadData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete facility.",
        variant: "destructive",
      });
    } finally {
      setLoadingDelete(false);
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div>
      <DataTable<Facility>
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
        onDelete={(id: number | undefined) => handleDelete(id)}
        idKey={"facilityId"}
      />
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          if (!loadingDelete) {
            setDeleteOpen(false);
            setDeleteId(null);
          }
        }}
        onConfirm={handleDeleteConfirmed}
        title="Delete Facility?"
        description="Are you sure you want to delete this facility? This action cannot be undone."
        confirmText={loadingDelete ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
