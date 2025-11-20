import { useEffect, useState, useCallback } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { Badge } from "@/components/ui/badge";
import { getFamilies, deleteFamily } from "@/api/family.api";
import { getFamilyTypes } from "@/api/family-type.api";
// import { getTeamCategories } from "@/api/team-category.api";
// import { getIdentityTypes } from "@/api/identity-type.api";
import type { Family } from "@/types/family";
import { getTeamCategories } from "@/api/team-category.api";
import { getIdentityTypes } from "@/api/identity-type.api";

export default function FamilyTable() {
  const [data, setData] = useState<Family[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Server-side state
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<string>("familyId");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [familyTypeOptions, setFamilyTypeOptions] = useState([]);
  const [teamCategoryOption, setTeamCategoryOption] = useState([]);
  const [identityTypeOption, setIdentityTypeOption] = useState([]);

  const getFamilyTypesDropDown = async () => {
    const response: any = await getFamilyTypes();
    const rows =
      (response && (response.data ?? response.rows ?? response)) ?? [];
    const items: any[] = Array.isArray(rows) ? rows : [];
    const options: any[] = items.map((it) => ({
      label: it.familyTypeName ?? "",
      value: it.familyTypeId ?? null,
    }));
    setFamilyTypeOptions(options);
  };

  const getTeamCategoryDropDown = async () => {
    const response: any = await getTeamCategories();
    const rows =
      (response && (response.data ?? response.rows ?? response)) ?? [];
    const items: any[] = Array.isArray(rows) ? rows : [];
    const options: any[] = items.map((it) => ({
      label: it.categoryName ?? "",
      value: it.teamCategoryId ?? null,
    }));
    setTeamCategoryOption(options);
  };

  const getIdentityTypeDropDown = async () => {
    const response: any = await getIdentityTypes();
    const rows =
      (response && (response.data ?? response.rows ?? response)) ?? [];
    const items: any[] = Array.isArray(rows) ? rows : [];
    const options: any[] = items.map((it) => ({
      label: it.identityTypeName ?? "",
      value: it.identityTypeId ?? null,
    }));
    setIdentityTypeOption(options);
  };

  // Load families from API (server-side)
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    getFamilyTypesDropDown();
    getTeamCategoryDropDown();
    getIdentityTypeDropDown();
  }, []);
  // Columns (unchanged visually)
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
      sortable: true,
      filterType: "select",
      filterOptions: familyTypeOptions,
      render: (row) => <Badge>{row.familyTypeName || "-"}</Badge>,
    },
    {
      key: "teamCategoryId",
      header: "Team Category",
      sortable: true,
      filterType: "select",
      filterOptions: teamCategoryOption,
      render: (row) => row.teamCategoryName || "-",
    },
    {
      key: "identityTypeId",
      header: "Identity",
      sortable: true,
      filterType: "select",
      filterOptions: identityTypeOption,
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
      ],
      render: (row: Family) => (
        <Badge variant={row.status === "active" ? "default" : "secondary"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      filterType: null,
      render: (row: Family) => new Date(row?.createdAt || "").toLocaleDateString() || "-",
    },
  ];

  const handleFilterChange = (key: string, value: any) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // NOTE: matches your DynamicTableProps: (key, direction)
  const handleSortChange = (key: string, direction: "ASC" | "DESC") => {
    setSortBy(key);
    setSortOrder(direction);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // const handleLimitChange = (newLimit: number) => {
  //   setPageSize(newLimit);
  //   setPage(1);
  // };

  // Delete Handler
  const handleDelete = async (id: string | number) => {
    const ok = confirm("Are you sure you want to delete this family?");
    if (!ok) return;
    try {
      await deleteFamily(Number(id));
      loadData();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  // Add Family button handler (placeholder)
  const handleAddFamily = () => {
    console.log("Add Family clicked");
  };

  return (
    <div className="container mx-auto py-10 px-4 space-y-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Family Management</h1>
          <p className="text-muted-foreground">
            Manage all families in your system using a dynamic table.
          </p>
        </div>

        <div>
          <button
            onClick={handleAddFamily}
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium shadow-sm bg-primary text-white hover:opacity-90"
            type="button"
          >
            Add Family
          </button>
        </div>
      </div>

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
        // now matches: (key, direction)
        onSortChange={handleSortChange}
        onView={(row) => console.log("View", row)}
        onEdit={(row) => console.log("Edit", row)}
        onDelete={(id: string | number) => handleDelete(id)}
        // optional idKey can be passed if DataTable needs it, e.g. idKey="familyId"
        idKey={"familyId"}
      />
    </div>
  );
}
