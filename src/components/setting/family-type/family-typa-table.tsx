"use client";

import React, { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { Button } from "@/components/ui/button";
import { getFamilyTypes, deleteFamilyTypes } from "@/api/family-type.api";
import type { FamilyType } from "@/types/familyType";
import { format } from "date-fns";

export default function FamilyTypeTable() {
  const [data, setData] = useState<FamilyType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // server state
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  // query state
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

      // normalize rows
      const rowsRaw = res?.data ?? [];
      // convert createdAt/updatedAt to Date objects to match your FamilyType type
      const rows = (rowsRaw as any[]).map((r) => ({
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
  }, [loadData]);

  const columns: Column<FamilyType>[] = [
    {
      key: "familyTypeName",
      header: "Family Type",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.familyTypeName}</span>
          <span className="text-xs text-muted-foreground">
            {r.prefix ?? "-"}
          </span>
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
      render: (r) => r.maxMembers ?? null,
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      filterType: null,
      render: (r) => (r.createdAt ? format(r.createdAt, "yyyy-MM-dd") : "-"),
    },
  ];

  // DataTable callbacks — each updates local state then reloads
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

  const handleDelete = async (id: string | number) => {
    const ok = confirm("Delete this family type?");
    if (!ok) return;
    try {
      await deleteFamilyTypes(Number(id));
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleView = (row: FamilyType) => console.log("view", row);
  const handleEdit = (row: FamilyType) => console.log("edit", row);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Family Types</h2>
        <Button onClick={() => console.log("Add family type clicked")}>
          Add Family Type
        </Button>
      </div>

      <DataTable<FamilyType>
        data={data}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          limit,
          total,
          onPageChange: handlePageChange
        }}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        idKey={"familyTypeId"}
      />
    </div>
  );
}
