import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { Badge } from "@/components/ui/badge";
import { getFamilies, deleteFamily } from "@/api/family.api";
import { getFamilyTypes } from "@/api/family-type.api";
import { getTeamCategories } from "@/api/team-category.api";
import { getIdentityTypes } from "@/api/identity-type.api";
import type { Family } from "@/types/family";
import { ConfirmDialog } from "../../dialogs/confirm-dialog";
import { format } from "date-fns";
import type { Response } from "@/types/response";

type SelectOption = { label: string; value: any };

type Props = {
  onOpenView: (row: Family) => void;
  onOpenForm: (row?: Family | null) => void;
  refreshKey?: number; // when this changes, reload data
};

export default function FamilyTable({
  onOpenView,
  onOpenForm,
  refreshKey,
}: Props) {
  const [data, setData] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string>("familyId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [familyTypeOptions, setFamilyTypeOptions] = useState<SelectOption[]>(
    []
  );
  const [teamCategoryOptions, setTeamCategoryOptions] = useState<
    SelectOption[]
  >([]);
  const [identityTypeOptions, setIdentityTypeOptions] = useState<
    SelectOption[]
  >([]);

  const normalizeRows = (res: any) =>
    (res && (res.data ?? res.rows ?? res)) ?? [];

  const loadFamilyTypeOptions = useCallback(async () => {
    try {
      const res: any = await getFamilyTypes({ page: 1, limit: 500 } as any);
      const rows = normalizeRows(res);
      setFamilyTypeOptions(
        (Array.isArray(rows) ? rows : []).map((r: any) => ({
          label: r.familyTypeName ?? String(r?.name ?? r?.label ?? ""),
          value: r.familyTypeId ?? r.id ?? null,
        }))
      );
    } catch (e) {
      console.warn("Failed to load family types", e);
      setFamilyTypeOptions([]);
    }
  }, []);

  const loadTeamCategoryOptions = useCallback(async () => {
    try {
      const res: any = await getTeamCategories({ page: 1, limit: 500 } as any);
      const rows = normalizeRows(res);
      setTeamCategoryOptions(
        (Array.isArray(rows) ? rows : []).map((r: any) => ({
          label: r.categoryName ?? String(r?.name ?? r?.label ?? ""),
          value: r.teamCategoryId ?? r.id ?? null,
        }))
      );
    } catch (e) {
      console.warn("Failed to load team categories", e);
      setTeamCategoryOptions([]);
    }
  }, []);

  const loadIdentityTypeOptions = useCallback(async () => {
    try {
      const res: any = await getIdentityTypes({ page: 1, limit: 500 } as any);
      const rows = normalizeRows(res);
      setIdentityTypeOptions(
        (Array.isArray(rows) ? rows : []).map((r: any) => ({
          label: r.identityTypeName ?? String(r?.name ?? r?.label ?? ""),
          value: r.identityTypeId ?? r.id ?? null,
        }))
      );
    } catch (e) {
      console.warn("Failed to load identity types", e);
      setIdentityTypeOptions([]);
    }
  }, []);

  useEffect(() => {
    loadFamilyTypeOptions();
    loadTeamCategoryOptions();
    loadIdentityTypeOptions();
  }, [loadFamilyTypeOptions, loadTeamCategoryOptions, loadIdentityTypeOptions]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: any = await getFamilies({
        page,
        limit: pageSize,
        sortBy,
        sortOrder,
        familyName: filters.familyName,
        profession: filters.profession,
        email: filters.email,
        status: filters.status,
        identityTypeId: filters.identityTypeId,
        familyTypeId: filters.familyTypeId,
        teamCategoryId: filters.teamCategoryId,
        preferredLanguage: filters.preferredLanguage,
        createdFrom: filters.createdFrom,
        createdTo: filters.createdTo,
      } as any);

      const rows = (res && (res.data ?? res.rows ?? res)) as
        | Family[]
        | undefined;
      const pagination =
        (res && (res.pagination ?? res.meta ?? res.pagination)) ?? null;

      setData(Array.isArray(rows) ? rows : []);
      if (pagination) {
        setTotal(Number(pagination.total ?? pagination.totalItems ?? 0));
      } else {
        setTotal(rows && rows.length ? (page - 1) * pageSize + rows.length : 0);
      }
    } catch (error) {
      console.error("Failed to load families", error);
      setData([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, filters]);

  // Load data initially and whenever relevant deps change.
  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]); // <-- refreshKey triggers reload

  const columns: Column<Family>[] = [
    {
      key: "familyName",
      header: "Family Name",
      sortable: true,
      filterType: "text",
      render: (row: Family) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.familyName}</span>
          <span className="text-xs text-muted-foreground">{row.email}</span>
        </div>
      ),
    },
    {
      key: "familyTypeId",
      header: "Family Type",
      sortable: false,
      filterType: "select",
      filterOptions: familyTypeOptions,
      render: (row) => <Badge>{row.familyTypeName || "-"}</Badge>,
    },
    {
      key: "teamCategoryId",
      header: "Team Category",
      sortable: false,
      filterType: "select",
      filterOptions: teamCategoryOptions,
      render: (row) => row.teamCategoryName || "-",
    },
    {
      key: "identityTypeId",
      header: "Identity",
      sortable: true,
      filterType: "select",
      filterOptions: identityTypeOptions,
      render: (row) => row.identityTypeName || "-",
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
      key: "createdAt",
      header: "Created",
      sortable: true,
      filterType: null,
      render: (row: Family) =>
        row.createdAt ? format(row?.createdAt, "dd MMM yyyy") || "-" : "-",
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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

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
      const res: Response = await deleteFamily(deleteId);
      const ok =
        typeof res?.success !== "undefined"
          ? res.success === true || String(res.success) === "true"
          : true;

      if (!ok) {
        throw new Error(
          (res as Record<string, any>)?.message || "Failed to delete family"
        );
      }
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
      <DataTable
        isLoading={isLoading}
        data={data}
        columns={columns}
        pagination={{
          page,
          limit: pageSize,
          total,
          onPageChange: handlePageChange,
        }}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onView={(row) => onOpenView(row)}
        onEdit={(row) => onOpenForm(row)}
        onDelete={(id) => handleDelete(id)}
        idKey={"familyId"}
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
        title="Delete Family?"
        description="Are you sure you want to delete this family? This action cannot be undone."
        confirmText={loadingDelete ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
