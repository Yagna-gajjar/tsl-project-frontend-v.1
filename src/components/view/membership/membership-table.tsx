import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getMemberships, deleteMembership } from "@/api/membership.api";
import type { membership } from "@/types/membership";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import { toast } from "@/hooks/use-toast";

type Props = {
  onView?: (row: membership) => void;
  onEdit?: (row: membership) => void;
  refreshKey?: number;
};

export default function MembershipTable({ onView, onEdit, refreshKey }: Props) {
  const [data, setData] = useState<membership[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<
    Record<string, string | number | undefined>
  >({});
  const [sortBy, setSortBy] = useState<string>("membershipId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getMemberships({
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
        membershipMasterId: filters.membershipMasterId as number | undefined,
        status: filters.status as string | undefined,
      });

      const rowsRaw = res?.data as membership[];

      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r) => ({
        ...r,
        startDate: r.startDate ? new Date(r.startDate) : undefined,
        endDate: r.endDate ? new Date(r.endDate) : undefined,
        graceDate: r.graceDate ? new Date(r.graceDate) : undefined,
        cancellationDate: r.cancelationDate
          ? new Date(r.cancelationDate)
          : undefined,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      })) as membership[];

      setData(rows);
    } catch (err) {
      console.error("Failed to fetch memberships", err);
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

  const columns: Column<membership>[] = [
    {
      key: "membershipType",
      header: "Membership Type",
      sortable: true,
      filterType: "text",
    },
    {
      key: "accountName",
      header: "Account",
      sortable: true,
      filterType: "text",
    },
    {
      key: "entityName",
      header: "Entity",
      sortable: true,
      filterType: "text",
    },
    {
      key: "startDate",
      header: "Start Date",
      sortable: true,
      render: (r) =>
        r.startDate ? new Date(r.startDate).toLocaleDateString() : "-",
    },
    {
      key: "endDate",
      header: "End Date",
      sortable: true,
      render: (r) =>
        r.endDate ? new Date(r.endDate).toLocaleDateString() : "-",
    },
    {
      key: "graceDate",
      header: "Grace Date",
      sortable: true,
      render: (r) =>
        r.endDate ? new Date(r.endDate).toLocaleDateString() : "-",
    },
    {
      key: "members",
      header: "Members",
      sortable: true,
      render: (r) => r.members,
    },
    {
      key: "totalIssueCharges",
      header: "Issue Charges",
      sortable: true,
      render: (r) => `Rs. ${Number(r.totalIssueCharges ?? 0).toFixed(2)}`,
    },
    {
      key: "appDiscount",
      header: "Appicable Discount",
      sortable: true,
      render: (r) => `Rs. ${Number(r.appDiscount ?? 0).toFixed(2)}`,
    },
    {
      key: "totalFBalance",
      header: "F Balacne",
      sortable: true,
      render: (r) => `Rs. ${Number(r.totalFBalance ?? 0).toFixed(2)}`,
    },
    {
      key: "totalCBalance",
      header: "C Balacne",
      sortable: true,
      render: (r) => `Rs. ${Number(r.totalCBalance ?? 0).toFixed(2)}`,
    },
    {
      key: "totalSpentCa",
      header: "Spent",
      sortable: true,
      render: (r) => `Rs. ${Number(r.totalSpentCa ?? 0).toFixed(2)}`,
    },
    {
      key: "caDepositPRRequiredFBalance",
      header: "CS deposite (%) required F",
      sortable: true,
      render: (r) =>
        `Rs. ${Number(r.caDepositPRRequiredFBalance ?? 0).toFixed(2)}`,
    },
    {
      key: "caDepositPRRequiredCBalance",
      header: "CS deposite (%) required C",
      sortable: true,
      render: (r) =>
        `Rs. ${Number(r.caDepositPRRequiredCBalance ?? 0).toFixed(2)}`,
    },
    {
      key: "depositeReq",
      header: "Deposite required",
      sortable: true,
      render: (r) => `Rs. ${Number(r.depositeReq ?? 0).toFixed(2)}`,
    },
    {
      key: "qualifyingRecieptNo",
      header: "Qualifying Reciept No",
      sortable: true,
      render: (r) => `Rs. ${Number(r.qualifyingRecieptNo ?? 0).toFixed(2)}`,
    },
    {
      key: "refundPaymentNo",
      header: "Refund Payment No",
      sortable: true,
      render: (r) => `Rs. ${Number(r.refundPaymentNo ?? 0).toFixed(2)}`,
    },
    {
      key: "vBalPrInCa",
      header: "V Balance ",
      sortable: true,
      render: (r) => `Rs. ${Number(r.vBalPrInCa ?? 0).toFixed(2)}`,
    },
    {
      key: "actualFBalance",
      header: "Actual F Bal ",
      sortable: true,
      render: (r) => `Rs. ${Number(r.actualFBalance ?? 0).toFixed(2)}`,
    },
    {
      key: "actualCBalance",
      header: "Actual C Bal ",
      sortable: true,
      render: (r) => `Rs. ${Number(r.actualCBalance ?? 0).toFixed(2)}`,
    },
    {
      key: "cancelationDate",
      header: "Cancelation Date",
      sortable: true,
      render: (r) =>
        r.endDate
          ? new Date(r.cancelationDate as Date).toLocaleDateString()
          : "-",
    },
    {
      key: "refundedAmount",
      header: "Refunded Amount",
      sortable: true,
      render: (r) => `Rs. ${Number(r.refundedAmount ?? 0).toFixed(2)}`,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      filterType: "select",
      filterOptions: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      render: (r) =>
        r.createdAt ? new Date(r.createdAt).toLocaleString() : "-",
    },
  ];

  const handleDelete = async (id: number | undefined) => {
    if (id === undefined) return;
    try {
      await deleteMembership(id);
      toast({
        title: "Success",
        description: "Membership deleted successfully",
      });
      setDeleteId(null);
      setDeleteOpen(false);
      await loadData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete membership",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <DataTable<membership>
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
        idKey={"membershipId"}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
        onConfirm={() => handleDelete(deleteId ?? undefined)}
        title="Delete Membership?"
        description="Are you sure you want to delete this membership? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
