import { useEffect, useState, useCallback } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { Badge } from "@/components/ui/badge";

import { getMembers, deleteMember } from "@/api/member.api";
import type { Member } from "@/types/member";

export default function MemberTable() {
  const [data, setData] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Pagination and sorting (server-side)
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  // Filters
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string>("memberId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const res: any = await getMembers({
        page,
        limit: pageSize,
        sortBy,
        sortOrder: sortOrder,
        ...filters,
      });

      const rows = res?.data ?? [];
      const pagination = res?.pagination ?? null;

      setData(Array.isArray(rows) ? rows : []);
      setTotal(pagination ? Number(pagination.total) : rows.length);
    } catch (error) {
      console.error("Failed to load members", error);
      setData([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: Column<Member>[] = [
    {
      key: "memberId",
      header: "ID",
      sortable: true,
    },
    {
      key: "memberFirstName",
      header: "Name",
      sortable: true,
      filterType: "text",
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.memberFirstName} {row.memberMiddleName ?? ""}{" "}
            {row.memberLastName}
          </span>
        </div>
      ),
    },
    {
      key: "gender",
      header: "Gender",
      sortable: true,
      filterType: "select",
      filterOptions: [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
        { label: "Other", value: "other" },
      ],
      render: (row) => row.gender,
    },
    {
      key: "familyId",
      header: "Family",
      sortable: true,
      render: (row: any) => row.familyName ?? `#${row.familyId}`,
    },
    {
      key: "city",
      header: "City",
      sortable: false,
      filterType: "text",
      render: (row: any) => (row.city ? `${row.city}` : `#${row.addressId}`),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      filterType: "select",
      filterOptions: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Block", value: "block" },
      ],
      render: (row) => (
        <Badge
          variant={
            row.status === "active"
              ? "default"
              : row.status === "inactive"
              ? "secondary"
              : "destructive"
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: "dob",
      header: "DOB",
      sortable: true,
      render: (row) => (row.dob ? new Date(row.dob).toLocaleDateString() : "-"),
    },
    {
      key: "contactNumber",
      header: "Contact",
      sortable: false,
    },
    {
      key: "relationship",
      header: "Relationship",
      sortable: false,
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: false,
      render: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-",
    },
  ];

  const handleFilterChange = (key: string, value: any) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (key: string, direction: "ASC" | "DESC") => {
    setSortBy(key);
    setSortOrder(direction);
    setPage(1);
  };

  const handleDelete = async (id: string | number) => {
    const ok = confirm("Delete this member?");
    if (!ok) return;

    try {
      await deleteMember(Number(id));
      loadData();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground">Manage all members.</p>
        </div>

        <button
          className="px-4 py-2 bg-primary text-white rounded-md"
          onClick={() => console.log("Add Member")}
        >
          Add Member
        </button>
      </div>

      <DataTable
        isLoading={isLoading}
        data={data}
        columns={columns}
        pagination={{
          page,
          limit: pageSize,
          total,
          onPageChange: setPage,
        }}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onView={(row) => console.log("view", row)}
        onEdit={(row) => console.log("edit", row)}
        onDelete={(id) => handleDelete(id)}
        idKey="memberId"
      />
    </div>
  );
}
