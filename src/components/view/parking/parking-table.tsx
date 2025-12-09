import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { format } from "date-fns";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

import type { Parking } from "@/types/parking";
import type { Response } from "@/types/response";
import { getParking, deleteParking } from "@/api/parking.api";

type Props = {
  onView?: (row: Parking) => void;
  onEdit?: (row: Parking) => void;
  refreshKey?: number;
};

export default function ParkingTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<Parking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<
    Record<string, string | number | undefined>
  >({});
  const [sortBy, setSortBy] = useState<string>("parkingId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getParking({
        page,
        limit,
        sortBy,
        sorting: sortOrder,
        search: search || undefined,
        vehicleNumber: filters.vehicleNumber as string | undefined,
        memberId: filters.memberId as string | undefined,
      });
        
    

        const rowsRaw = Array.isArray(res) ? res : (res as any)?.data ?? [];
        console.log(rowsRaw);
        
    //   const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r: any) => ({
    //     ...r,
    //     startDate: r.startDate ? new Date(r.startDate) : undefined,
    //     endDate: r.endDate ? new Date(r.endDate) : undefined,
    //     startTime: r.startTime ? new Date(r.startTime) : undefined,
    //     entTime: r.entTime ? new Date(r.entTime) : undefined,
    //   })) as Parking[];

      setData(rowsRaw);
      setTotal(rowsRaw.length ?? 0);
    } catch (err) {
      console.error("Failed to fetch parking", err);
      setData([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const columns: Column<Parking>[] = [
    {
      key: "memberFirstName",
      header: "Member",
      sortable: true,
      filterType: "text",
      render: (r) => (r.memberFirstName + " " + r.memberLastName),
    },
    {
      key: "vehicleNumber",
      header: "Vehicle",
      sortable: true,
      filterType: "text",
      render: (r) => r.vehicleNumber ?? "-",
    },
    {
      key: "vehicleType",
      header: "Type",
      sortable: true,
      filterType: "text",
      render: (r) => r.vehicleType ?? "-",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      filterType: "text",
      render: (r) => r.status ?? "-",
    },
    {
      key: "startDate",
      header: "Start",
      sortable: true,
      filterType: null,
      render: (r) =>
        r.startDate ? format(new Date(r.startDate), "dd MMM yyyy") : "-",
    },
    {
      key: "endDate",
      header: "End",
      sortable: true,
      filterType: null,
      render: (r) =>
        r.endDate ? format(new Date(r.endDate), "dd MMM yyyy") : "-",
    },
    {
      key: "PaymentTotalAmount",
      header: "Total",
      sortable: true,
      filterType: "number",
      render: (r) => (r.paymentAmount),
    },
    {
      key: "paid",
      header: "Paid",
      sortable: true,
      filterType: "number",
      render: (r) => (r.paid),
    },
  ];

  const handleSearchChange = (q: string) => {
    setSearch(q);
    setPage(1);
  };

  const handleFilterChange = (
    filterKey: string,
    value: string | number | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [filterKey]: value || undefined }));
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
      const res: Response = await deleteParking(deleteId);
      const ok =
        typeof res?.success !== "undefined"
          ? res.success === true || String(res.success) === "true"
          : true;
      if (!ok)
        throw new Error((res as any)?.message || "Failed to delete parking");
      await loadData();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete parking.",
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
      <DataTable<Parking>
        data={data}
        columns={columns}
        isLoading={isLoading}
        pagination={{ page, limit, total, onPageChange: handlePageChange }}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onView={(row) => onView?.(row)}
        onEdit={(row) => onEdit?.(row)}
        onDelete={(id: number | undefined) => handleDelete(id)}
        idKey={"parkingId"}
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
        title="Delete Parking?"
        description="Are you sure you want to delete this parking record?"
        confirmText={loadingDelete ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
