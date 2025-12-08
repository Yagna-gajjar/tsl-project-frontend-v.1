// MembershipMasterTable.tsx
import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { getMembershipMasters } from "@/api/membershipMaster.api";
import type { membershipMaster } from "@/types/memberShipMaster";
import { format } from "date-fns";

type Props = {
  onView?: (row: membershipMaster) => void;
  refreshKey?: number;
};

export default function MembershipMasterTable({ onView, refreshKey }: Props) {
  const [data, setData] = useState<membershipMaster[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

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
        guardianEntry:
          filters.guardianEntry === "true"
            ? true
            : filters.guardianEntry === "false"
            ? false
            : undefined,
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

      // normalize response shape similar to EnrollmentTable
      const rowsRaw = Array.isArray(res)
        ? res
        : Array.isArray((res as Record<string, unknown>)?.data)
        ? ((res as Record<string, unknown>).data as membershipMaster[])
        : [];

      const rows = (Array.isArray(rowsRaw) ? rowsRaw : []).map((r) => ({
        ...r,
        introduceDate: r.introduceDate ? new Date(r.introduceDate) : undefined,
        suspendDate: r.suspendDate ? new Date(r.suspendDate) : undefined,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      })) as membershipMaster[];

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

  const formatDate = (d?: Date | string) =>
    d ? format(new Date(d), "dd MMM yyyy") : "-";

  const columns: Column<membershipMaster>[] = [
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
      key: "introduceDate",
      render: (row) => formatDate(row.introduceDate),
      sortable: true,
    },
    {
      header: "Suspend Date",
      key: "suspendDate",
      render: (row) => formatDate(row.suspendDate),
      sortable: true,
    },
    {
      header: "Duration (days)",
      key: "membershipDurationInDays",
      render: (row) =>
        typeof row.membershipDurationInDays === "number"
          ? row.membershipDurationInDays
          : "-",
      sortable: true,
      filterType: "number",
    },
    {
      header: "Issue Charge",
      key: "issueCharge",
      render: (row) => `Rs. ${Number(row.issueCharge ?? 0).toFixed(2)}`,
      sortable: true,
      filterType: "number",
    },
    {
      header: "Min F Balance",
      key: "minFBalance",
      render: (row) => Number(row.minFBalance ?? 0).toFixed(2),
      sortable: true,
      filterType: "number",
    },
    {
      header: "Min C Balance",
      key: "minCBalance",
      render: (row) => Number(row.minCBalance ?? 0).toFixed(2),
      sortable: true,
      filterType: "number",
    },
    {
      header: "Min V Balance",
      key: "minVBalance",
      render: (row) => Number(row.minVBalance ?? 0).toFixed(2),
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
      header: "Reg Member Included",
      key: "regMemberIncluded",
      render: (row) => row.regMemberIncluded ?? 0,
      sortable: true,
      filterType: "number",
    },
    {
      header: "Guardian Entry",
      key: "guardianEntry",
      render: (row) => (row.guardianEntry ? "Yes" : "No"),
      sortable: true,
      filterType: "select",
      filterOptions: [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ],
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
      header: "RFID",
      key: "rfid",
      render: (row) => row.rfid || "-",
      sortable: true,
      filterType: "text",
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
      header: "Birthday Venue",
      key: "birthdayVenueUsage",
      render: (row) => (row.birthdayVenueUsage ? "Yes" : "No"),
      filterType: "select",
      filterOptions: [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ],
    },
    {
      header: "Anniversary Venue",
      key: "anniversaryVenueUsage",
      render: (row) => (row.anniversaryVenueUsage ? "Yes" : "No"),
      filterType: "select",
      filterOptions: [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ],
    },
    {
      header: "Cancellation Charges",
      key: "cancallationCharges",
      render: (row) => `Rs. ${Number(row.cancallationCharges ?? 0).toFixed(2)}`,
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

  return (
    <div>
      <DataTable<membershipMaster>
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
        idKey={"membershipMasterId"}
      />
    </div>
  );
}
