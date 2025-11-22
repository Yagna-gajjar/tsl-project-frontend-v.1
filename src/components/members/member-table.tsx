"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { Badge } from "@/components/ui/badge";

import { getMembers, deleteMember } from "@/api/member.api";
import type { Member } from "@/types/member";

type Props = {
  onOpenForm: (row?: Member | null) => void;
  onOpenView?: (row: Member) => void;
  refreshKey?: number;
  initialFamilyId?: number | undefined;
};

export default function MemberTable({
  onOpenForm,
  onOpenView,
  refreshKey,
  initialFamilyId,
}: Props) {
  const [data, setData] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  // initialize filters from prop (only once)
  const [filters, setFilters] = useState<Record<string, any>>(() => {
    return initialFamilyId ? { familyId: initialFamilyId } : {};
  });

  const [sortBy, setSortBy] = useState<string>("memberId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  // stable fetch function using current state
  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: any = await getMembers({
        page,
        limit: pageSize,
        sortBy,
        sortOrder,
        ...filters,
      });

      const rows = res?.data ?? res ?? [];
      const pagination = res?.pagination ?? null;

      setData(Array.isArray(rows) ? rows : []);
      if (pagination) {
        setTotal(Number(pagination.total ?? pagination.totalItems ?? 0));
      } else {
        setTotal(Array.isArray(rows) ? rows.length : 0);
      }
    } catch (error) {
      console.error("Failed to load members", error);
      setData([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, filters]);

  // Fetch when relevant inputs change
  useEffect(() => {
    fetchMembers();
    // refreshKey allows parent to force a reload
  }, [fetchMembers, refreshKey]);

  // If initialFamilyId changes, update filters (no direct fetch here)
  useEffect(() => {
    if (initialFamilyId === undefined || initialFamilyId === null) return;

    setFilters((prev) => {
      if (prev.familyId === initialFamilyId) return prev;
      return { ...prev, familyId: initialFamilyId };
    });
    setPage(1);
  }, [initialFamilyId]);

  const columns: Column<Member>[] = [
    { key: "memberId", header: "ID", sortable: true },
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
    { key: "contactNumber", header: "Contact", sortable: false },
    { key: "relationship", header: "Relationship", sortable: false },
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
      // re-fetch after delete
      await fetchMembers();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  return (
    <div>
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
        onView={(row: Member) => {
          onOpenView?.(row);
        }}
        onEdit={(row) => onOpenForm(row)}
        onDelete={(id) => handleDelete(id)}
        idKey="memberId"
      />
    </div>
  );
}
