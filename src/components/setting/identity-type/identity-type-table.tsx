"use client";

import React, { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

import type { IdentityType } from "@/types/identityType";
import type { FamilyType } from "@/types/familyType";
import type { TeamCategory } from "@/types/teamCategory";

// Replace these imports with your actual api functions (you mentioned getIdentityTypes earlier)
import { getIdentityTypes, deleteIdentityTypes } from "@/api/identity-type.api";
import { getFamilyTypes } from "@/api/family-type.api";
import { getTeamCategories } from "@/api/team-category.api";

type SelectOption = { label: string; value: string | number };

export default function IdentityTypeTable() {
  const [data, setData] = useState<IdentityType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // server state
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  // query state
  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string>("identityTypeId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  // dropdown options for filters
  const [familyOptions, setFamilyOptions] = useState<SelectOption[]>([]);
  const [teamOptions, setTeamOptions] = useState<SelectOption[]>([]);

  // Load family types and team categories for select filters
  const loadFilterOptions = useCallback(async () => {
    try {
      const fRes = await getFamilyTypes({ page: 1, limit: 100 } as any);
      // handle both array or { data, pagination } responses
      const fRows: FamilyType[] = Array.isArray(fRes)
        ? (fRes as any)
        : fRes?.data ?? [];
      setFamilyOptions(
        (fRows || []).map((f) => ({
          label: f.familyTypeName,
          value: f.familyTypeId ?? "",
        }))
      );
    } catch (e) {
      console.warn("Failed to load family types", e);
      setFamilyOptions([]);
    }

    try {
      const tRes = await getTeamCategories({ page: 1, limit: 100 } as any);
      const tRows: TeamCategory[] = Array.isArray(tRes)
        ? (tRes as any)
        : tRes?.data ?? [];
      setTeamOptions(
        (tRows || []).map((t) => ({
          label: t.categoryName,
          value: t.teamCategoryId ?? "",
        }))
      );
      // include a `null` option if backend supports teamCategoryId=null meaning 'none'
      setTeamOptions((prev) => [
        { label: "No category (null)", value: "null" },
        ...prev,
      ]);
    } catch (e) {
      console.warn("Failed to load team categories", e);
      setTeamOptions([]);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Build API params from state
      const params: any = {
        page,
        limit,
        sortBy,
        order: sortOrder,
      };
      if (search) params.search = search;
      // toolbar sends numeric values (kept types) — pass them if present
      if (filters.familyTypeId !== undefined)
        params.familyTypeId = filters.familyTypeId;
      if (filters.teamCategoryId !== undefined)
            params.teamCategoryId = filters.teamCategoryId;
    if (filters.discount !== undefined) params.discount = filters.discount;

    const res: any = await getIdentityTypes(params);

      // support both array and { data, pagination } shapes
      const rowsRaw: any[] = Array.isArray(res)
        ? (res as any)
        : res?.data ?? [];
      const rows = (rowsRaw || []).map((r) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : undefined,
      })) as IdentityType[];

      setData(rows);

      const totalCount = Array.isArray(res)
        ? rows.length
        : Number(res?.pagination?.total ?? rows.length);
      setTotal(totalCount);
    } catch (err) {
      console.error("Failed to fetch identity types", err);
      setData([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, filters]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Table columns. Keep UI unchanged; only configure columns + filter types.
  const columns: Column<IdentityType>[] = [
    {
      key: "identityTypeName",
      header: "Identity",
      sortable: true,
      filterType: "text",
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r.identityTypeName}</span>
        </div>
      ),
    },
    {
      key: "familyTypeId",
      header: "Family Type",
      sortable: true,
      filterType: "select",
      filterOptions: [
        ...familyOptions.map((o) => ({ label: o.label, value: o.value })),
      ],
      render: (r) => {
        const ft = familyOptions.find(
          (f) => String(f.value) === String(r.familyTypeId)
        );
        return ft ? ft.label : String(r.familyTypeId ?? "-");
      },
    },
    {
      key: "teamCategoryId",
      header: "Team Category",
      sortable: true,
      filterType: "select",
      filterOptions: [
        { label: "No category (null)", value: "null" },
        ...teamOptions.map((o) => ({ label: o.label, value: o.value })),
      ],
      render: (r) => {
        if (r.teamCategoryId === null || r.teamCategoryId === undefined)
          return "-";
        const t = teamOptions.find(
          (t) => String(t.value) === String(r.teamCategoryId)
        );
        return t ? t.label : String(r.teamCategoryId);
      },
    },
    {
      key: "discount",
      header: "Discount",
      sortable: true,
      filterType: "number",
      render: (r) => (typeof r.discount === "number" ? `${r.discount}` : "-"),
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

    // For select control the toolbar sends "all" or "null" (string) or numeric / typed value.
    // Normalize:
    const normalized =
      value === "" || value === null || value === undefined
        ? undefined
        : value === "all"
        ? undefined
        : value === "null"
        ? "null"
        : value;

    setFilters((prev) => {
      const next = { ...prev };
      if (normalized === undefined) delete next[key];
      else next[key] = normalized;
      return next;
    });
  };

  const handleSortChange = (key: string, direction: "ASC" | "DESC") => {
    setSortBy(key || "identityTypeId");
    setSortOrder(direction || "ASC");
    setPage(1);
  };

  const handlePageChange = (p: number) => setPage(p);

  const handleDelete = async (id: string | number) => {
    const ok = confirm("Delete this identity type?");
    if (!ok) return;
    try {
      if (typeof deleteIdentityTypes === "function") {
        await deleteIdentityTypes(Number(id));
        loadData();
      } else {
        console.warn("deleteIdentityType API not available");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleView = (row: IdentityType) => console.log("view", row);
  const handleEdit = (row: IdentityType) => console.log("edit", row);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Identity Types</h2>
        <Button onClick={() => console.log("Add identity type clicked")}>
          Add Identity Type
        </Button>
      </div>

      <DataTable<IdentityType>
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
        idKey={"identityTypeId"}
      />
    </div>
  );
}
