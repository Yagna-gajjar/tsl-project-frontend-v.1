"use client";

import React, { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { Button } from "@/components/ui/button";
import { getTeamCategories, deleteTeamCategories } from "@/api/team-category.api";
import type { TeamCategory } from "@/types/teamCategory";
import { format } from "date-fns";

export default function TeamCategoryTable() {
  const [data, setData] = useState<TeamCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // server state
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  // query state
  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string>("teamCategoryId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res : any = await getTeamCategories({
        page,
        limit,
        sortBy,
        sortOrder,
        search: search || undefined,
        categoryName: filters.categoryName ?? undefined,
        shortName: filters.shortName ?? undefined,
        access: filters.access ?? undefined,
      } as any);

      const rowsRaw = res?.data ?? [];
      const rows = (rowsRaw as any[]).map((r) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      })) as TeamCategory[];

      setData(rows);
      setTotal(Number(res?.pagination?.total ?? rows.length ?? 0));
    } catch (err) {
      console.error("Failed to fetch team categories", err);
      setData([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: Column<TeamCategory>[] = [
    {
      key: "categoryName",
      header: "Category",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.categoryName}</span>
          <span className="text-xs text-muted-foreground">
            {r.shortName ?? "-"}
          </span>
        </div>
      ),
    },
    {
      key: "shortName",
      header: "Short Name",
      sortable: true,
      filterType: "text",
      render: (r) => r.shortName ?? "-",
    },
    {
      key: "access",
      header: "Access",
      sortable: true,
      filterType: null,
      render: (r) => r.access ?? "-",
    },
    {
      key: "details",
      header: "Details",
      sortable: false,
      filterType: null,
      render: (r) => (r.details ? String(r.details).slice(0, 80) : "-"),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      filterType: null,
      render: (r) => (r.createdAt ? format(r.createdAt, "yyyy-MM-dd") : "-"),
    },
  ];

  // DataTable callbacks
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
    setSortBy(key || "teamCategoryId");
    setSortOrder(direction || "ASC");
    setPage(1);
  };

  const handlePageChange = (p: number) => setPage(p);

  const handleDelete = async (id: string | number) => {
    const ok = confirm("Delete this team category?");
    if (!ok) return;
    try {
      await deleteTeamCategories(Number(id));
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleView = (row: TeamCategory) => console.log("view", row);
  const handleEdit = (row: TeamCategory) => console.log("edit", row);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Team Categories</h2>
        <Button onClick={() => console.log("Add team category clicked")}>
          Add Team Category
        </Button>
      </div>

      <DataTable<TeamCategory>
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
        idKey={"teamCategoryId"}
      />
    </div>
  );
}
