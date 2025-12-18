import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import {
  getMembershipMasters,
  deleteMembershipMaster,
} from "@/api/membershipMaster.api";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { MembershipMaster } from "@/types/memberShipMaster";

type Props = {
  onView?: (row: MembershipMaster) => void;
  onEdit?: (row: MembershipMaster) => void;
  refreshKey?: number;
};

export default function MembershipMasterTable({
  onView,
  onEdit,
  refreshKey,
}: Props) {
  const [data, setData] = useState<MembershipMaster[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<
    Record<string, string | number | undefined>
  >({});
  const [sortBy, setSortBy] = useState<string>("membershipMasterId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getMembershipMasters({
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
        membershipType: filters.membershipType as string | undefined,
        guestAllowed:
          filters.guestAllowed === "true"
            ? true
            : filters.guestAllowed === "false"
            ? false
            : undefined,
        clubAccess:
          filters.clubAccess === "true"
            ? true
            : filters.clubAccess === "false"
            ? false
            : undefined,
      });

      const rowsRaw = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? (res.data as MembershipMaster[])
        : [];

      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r) => ({
        ...r,
        introductionDate: r.introductionDate
          ? new Date(r.introductionDate)
          : undefined,
        suspensionDate: r.suspensionDate
          ? new Date(r.suspensionDate)
          : undefined,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      })) as MembershipMaster[];

      setData(rows);
    } catch (err) {
      console.error("Failed to fetch membership masters", err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

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

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const formatDate = (d?: Date | string) =>
    d ? format(new Date(d), "dd MMM yyyy") : "-";

  const columns: Column<MembershipMaster>[] = [
    {
      header: "ID",
      key: "membershipMasterId",
      render: (row) => row.membershipMasterId ?? "-",
      sortable: true,
    },
    {
      header: "Type",
      key: "membershipType",
      render: (row) => row.membershipType || "-",
      sortable: true,
      filterType: "text",
    },
    {
      header: "Introduce Date",
      key: "introductionDate",
      render: (row) => formatDate(row.introductionDate),
      sortable: true,
    },
    {
      header: "Suspend Date",
      key: "suspensionDate",
      render: (row) => formatDate(row.suspensionDate),
      sortable: true,
    },
    {
      header: "Duration (days)",
      key: "durationDays",
      render: (row) =>
        typeof row.durationDays === "number" ? row.durationDays : "-",
      sortable: true,
      filterType: "number",
    },
    {
      header: "Issue Charge",
      key: "minIssueCharge",
      render: (row) => `Rs. ${Number(row.minIssueCharge ?? 0).toFixed(2)}`,
      sortable: true,
      filterType: "number",
    },
    {
      header: "Min F Balance",
      key: "caDepositPR",
      render: (row) => Number(row.caDepositPR ?? 0).toFixed(2),
      sortable: true,
      filterType: "number",
    },
    {
      header: "Min C Balance",
      key: "cBalPrInCa",
      render: (row) => Number(row.cBalPrInCa ?? 0).toFixed(2),
      sortable: true,
      filterType: "number",
    },
    {
      header: "Min V Balance",
      key: "vBalPrInCa",
      render: (row) => Number(row.vBalPrInCa ?? 0).toFixed(2),
      sortable: true,
      filterType: "number",
    },
    {
      header: "Booking Discount (%)",
      key: "bookingDiscount",
      render: (row) => `${Number(row.bookingDiscount ?? 0).toFixed(2)}%`,
      sortable: true,
      filterType: "number",
    },
    {
      header: "Grace Days",
      key: "graceDays",
      render: (row) => row.graceDays ?? 0,
      sortable: true,
      filterType: "number",
    },
    {
      header: "Guest Allowed",
      key: "guestAllowed",
      render: (row) => (row.guestAllowed ? "Yes" : "No"),
      sortable: true,
      filterType: "select",
      filterOptions: [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ],
    },
    {
      header: "Club Access",
      key: "clubAccess",
      render: (row) => (row.clubAccess ? "Yes" : "No"),
      sortable: true,
      filterType: "select",
      filterOptions: [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ],
    },
    {
      header: "Cancellation Charges",
      key: "cancelChargesPrOnCa",
      render: (row) => `Rs. ${Number(row.cancelChargesPrOnCa ?? 0).toFixed(2)}`,
      sortable: true,
    },
    {
      header: "Details",
      key: "membershipDetails",
      render: (row) => row.membershipDetails || "-",
    },
    {
      header: "Created At",
      key: "createdAt",
      render: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleString() : "-",
      sortable: true,
    },
    {
      header: "Updated At",
      key: "updatedAt",
      render: (row) =>
        row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-",
      sortable: true,
    },
  ];

  const handleDelete = async (id: number | undefined) => {
    if (id === undefined) return;

    try {
      await deleteMembershipMaster(id);
      toast({
        title: "Success",
        description: "Membership master deleted successfully",
      });
      setDeleteId(null);
      setDeleteOpen(false);
      await loadData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete membership master",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <DataTable<MembershipMaster>
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
        idKey={"membershipMasterId"}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={() => handleDelete(deleteId ?? undefined)}
        title="Delete Membership Master?"
        description="Are you sure you want to delete this membership master? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
