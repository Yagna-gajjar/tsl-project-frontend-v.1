import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getEntities, deleteEntity } from "@/api/entity.api";
import type { Entity } from "@/types/entity";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";

type Props = {
  onView?: (row: Entity) => void;
  onEdit?: (row: Entity) => void;
  refreshKey?: number;
};

export default function EntityTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<Entity[]>([]); 
  const [isLoading, setIsLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string | undefined>>(
    {}
  );
  const [sortBy, setSortBy] = useState("entityId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: Response<Entity[]> = await getEntities({
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
        entityName: filters.entityName,
        entityType: filters.entityType,
        legalStatus: filters.legalStatus,
      });

      setTotal(res.pagination.total);

      const rows = Array.isArray(res?.data) ? res.data : [];
      
      setData(
        rows?.map((r) => ({
          ...r,
          regDate: new Date(r.regDate),
          suspensionDate: r.suspensionDate
            ? new Date(r.suspensionDate)
            : undefined,
        }))
      );
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch entities",
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

  const columns: Column<Entity>[] = [
    {
      key: "entityName",
      header: "Entity Name",
      sortable: true,
    },
    {
      key: "entityType",
      header: "Entity Type",
      sortable: true,
    },
    {
      key: "legalStatus",
      header: "Legal Status",
    },
    {
      key: "legalName",
      header: "Legal Name",
    },
    {
      key: "regDate",
      header: "Registration Date",
      sortable: true,
      render: (r) =>
        r.regDate ? new Date(r.regDate).toLocaleDateString() : "-",
    },
  ];

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEntity(deleteId);
      toast({ title: "Deleted", variant: "success" });
      loadData();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      <DataTable<Entity>
        data={data}
        columns={columns}
        isLoading={isLoading}
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
        onFilterChange={(k, v) =>
          setFilters((p) => ({ ...p, [k]: v as string }))
        }
        onSortChange={(c, d) => {
          setSortBy(c);
          setSortOrder(d);
        }}
        onView={onView}
        onEdit={onEdit}
        onDelete={(id) => {
          setDeleteId(id ?? null);
          setDeleteOpen(true);
        }}
        idKey="entityId"
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Entity?"
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
}
