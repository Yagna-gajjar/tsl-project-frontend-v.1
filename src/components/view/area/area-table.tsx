import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";

import { getAreas, deleteArea } from "@/api/area.api";
import type { Area } from "@/types/area";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

type Props = {
  onView?: (row: Area) => void;
  onEdit?: (row: Area) => void;
  refreshKey?: number;
};

export default function AreaTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<
    Record<string, string | number | undefined>
  >({});
  const [sortBy, setSortBy] = useState<string>("areaId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getAreas({
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
        areaName: filters.areaName as string | undefined,
        facilityId: filters.facilityId as number | undefined,
      });

      const rowsRaw = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? (res.data as Area[])
          : [];
      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      })) as Area[];

      setData(rows);
    } catch (err) {
      console.error("Failed to fetch areas", err);
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
    setSortBy(column);
    setSortOrder(direction);
    setPage(1);
  };

  const handlePageChange = (p: number) => setPage(p);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleDelete = async (id: number | undefined) => {
    if (id === undefined) return;

    try {
      await deleteArea(id);
      toast({
        title: "Success",
        description: "Area deleted successfully",
      });
      setDeleteId(null);
      setDeleteOpen(false);
      await loadData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete area",
        variant: "destructive",
      });
    }
  };

  const columns: Column<Area>[] = [
    {
      key: "areaName",
      header: "Area Name",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.areaName}</span>
        </div>
      ),
    },
    {
      key: "facilityName",
      header: "Facility",
      sortable: false,
      filterType: null,
      render: (r) => <span className="text-sm">{r.facilityName || "N/A"}</span>,
    },
    {
      key: "areaSQFT",
      header: "Area SQFT",
      sortable: true,
      filterType: null,
      render: (r) => <span className="text-sm">{r.areaSQFT || "-"}</span>,
    },
    {
      key: "portion",
      header: "Portion",
      sortable: true,
      filterType: null,
      render: (r) => <span className="text-sm">{r.portion || "-"}</span>,
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

  return (
    <div>
      <DataTable<Area>
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
        idKey={"areaId"}
      />
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={() => handleDelete(deleteId ?? undefined)}
        title="Delete Area?"
        description="Are you sure you want to delete this area? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
