import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { format } from "date-fns";

import { getFamilyTypes, deleteFamilyTypes } from "@/api/family-type.api";
import type { FamilyType } from "@/types/familyType";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";

type Props = {
  onView?: (row: FamilyType) => void;
  onEdit?: (row: FamilyType) => void;
  refreshKey?: number;
};

export default function FamilyTypeTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<FamilyType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string>("familyTypeId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: any = await getFamilyTypes({
        page,
        limit,
        sortBy,
        sorting: sortOrder,
        search: search || undefined,
        familyTypeName: filters.familyTypeName ?? undefined,
        maxMembers: filters.maxMembers ?? 10000,
      } as any);

      const rowsRaw = res?.data ?? res ?? [];
      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r: any) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      })) as FamilyType[];

      setData(rows);
      const totalCount = Number(res?.pagination?.total ?? rows.length ?? 0);
      setTotal(totalCount);
    } catch (err) {
      console.error("Failed to fetch family types", err);
      setData([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const columns: Column<FamilyType>[] = [
    {
      key: "familyTypeName",
      header: "Family Type",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.familyTypeName}</span>
        </div>
      ),
    },
    {
      key: "prefix",
      header: "Prefix",
      sortable: true,
      filterType: null,
      render: (r) => r.prefix ?? "-",
    },
    {
      key: "maxMembers",
      header: "Max Members",
      sortable: true,
      filterType: "number",
      render: (r) => r.maxMembers ?? "-",
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
    setPage(1);
    setSearch(q);
  };

  const handleFilterChange = (key: string, value: any) => {
    setPage(1);
    setFilters((prev) => {
      const next = { ...prev };
      if (value === "" || value === null || value === undefined)
        delete next[key];
      else next[key] = value;
      return next;
    });
  };

  const handleSortChange = (key: string, direction: "ASC" | "DESC") => {
    setSortBy(key || "familyTypeId");
    setSortOrder(direction || "ASC");
    setPage(1);
  };

  const handlePageChange = (p: number) => setPage(p);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleDelete = (id?: number) => {
    if (id === undefined || id === null) return;
    setDeleteId(id);
    setDeleteOpen(true); // open your AlertDialog
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    try {
      setLoadingDelete(true);
      await deleteFamilyTypes(deleteId);
      await loadData(); // refresh table
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setLoadingDelete(false);
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div>
      <DataTable<FamilyType>
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
        onDelete={(id : number | undefined) => handleDelete(id)}
        idKey={"familyTypeId"}
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
        title="Delete Family Type?"
        description="Are you sure you want to delete this family type? This action cannot be undone."
        confirmText={loadingDelete ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
