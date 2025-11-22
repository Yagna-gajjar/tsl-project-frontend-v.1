"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { format } from "date-fns";

import type { IdentityType } from "@/types/identityType";
import type { FamilyType } from "@/types/familyType";
import type { TeamCategory } from "@/types/teamCategory";

import { getIdentityTypes, deleteIdentityTypes } from "@/api/identity-type.api";
import { getFamilyTypes } from "@/api/family-type.api";
import { getTeamCategories } from "@/api/team-category.api";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";

type SelectOption = { label: string; value: string | number };

export default function IdentityTypeTable({
  refreshKey,
  onView,
  onEdit,
}: {
  refreshKey?: number;
  onView?: (row: IdentityType) => void;
  onEdit?: (row: IdentityType) => void;
}) {
  const [data, setData] = useState<IdentityType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string>("identityTypeId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [familyOptions, setFamilyOptions] = useState<SelectOption[]>([]);
  const [teamOptions, setTeamOptions] = useState<SelectOption[]>([]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const fRes: any = await getFamilyTypes({ page: 1, limit: 500 } as any);
      const fRows: FamilyType[] = Array.isArray(fRes) ? fRes : fRes?.data ?? [];
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
      const tRes: any = await getTeamCategories({ page: 1, limit: 500 } as any);
      const tRows: TeamCategory[] = Array.isArray(tRes)
        ? tRes
        : tRes?.data ?? [];
      const opts = (tRows || []).map((t) => ({
        label: t.categoryName,
        value: t.teamCategoryId ?? "",
      }));
      setTeamOptions([{ label: "No category (null)", value: "null" }, ...opts]);
    } catch (e) {
      console.warn("Failed to load team categories", e);
      setTeamOptions([{ label: "No category (null)", value: "null" }]);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = { page, limit, sortBy, order: sortOrder };
      if (search) params.search = search;
      if (filters.familyTypeId !== undefined)
        params.familyTypeId = filters.familyTypeId;
      if (filters.teamCategoryId !== undefined)
        params.teamCategoryId = filters.teamCategoryId;
      if (filters.discount !== undefined) params.discount = filters.discount;

      const res: any = await getIdentityTypes(params);

      const rowsRaw: any[] = Array.isArray(res) ? res : res?.data ?? [];
      const rows = (rowsRaw || []).map((r: any) => ({
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
  }, [loadData, refreshKey]);

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
      filterOptions: familyOptions,
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
      filterOptions: teamOptions,
      render: (r) => {
        if (r.teamCategoryId === null || r.teamCategoryId === undefined)
          return "-";
        if (String(r.teamCategoryId) === "null") return "No category";
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
      render: (r) =>
        typeof r.discount === "number" ? String(r.discount) : "-",
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      filterType: null,
      render: (r) => (r.createdAt ? format(r.createdAt, "yyyy-MM-dd") : "-"),
    },
  ];

  const handleSearchChange = (q: string) => {
    setPage(1);
    setSearch(q);
  };

  const handleFilterChange = (key: string, value: any) => {
    setPage(1);
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

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // When user clicks "Delete" in the table
  const handleDelete = (id?: number) => {
    if (id === undefined || id === null) return;
    setDeleteId(id);
    setDeleteOpen(true); // open your AlertDialog
  };

  // When user confirms delete in the dialog
  const handleDeleteConfirmed = async () => {
    if (!deleteId) return;
    try {
      setLoadingDelete(true);
      await deleteIdentityTypes(deleteId);
      await loadData(); // refresh table
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setLoadingDelete(false);
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div>
      <DataTable<IdentityType>
        data={data}
        columns={columns}
        isLoading={isLoading}
        pagination={{ page, limit, total, onPageChange: handlePageChange }}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onView={(row) => onView?.(row)}
        onEdit={(row) => onEdit?.(row)}
        onDelete={(id) => handleDelete(id)}
        idKey={"identityTypeId"}
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
        title="Delete identity Type?"
        description="Are you sure you want to delete this identity type? This action cannot be undone."
        confirmText={loadingDelete ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
