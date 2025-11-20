import { useEffect, useState, useMemo } from "react";
import { DataTable } from "@/components/data-table/data-table";
import type { Column } from "@/components/data-table/types";
import { Badge } from "@/components/ui/badge";
import { getFamilies, deleteFamily } from "@/api/family.api";

// Family Interface
interface Family {
  familyId: number;
  familyName: string;
  familyTypeId: number;
  teamCategoryId: number | null;
  identityTypeId: number;
  profession: string;
  professionDetails: string;
  designation: string;
  emergencyContact: string;
  remarks: string;
  email: string;
  status: string;
  preferredLanguage: string;
  createdAt: string;
  updatedAt: string;
  familyTypeName?: string;
  teamCategoryName?: string;
  identityTypeName?: string;
}

export default function FamilyTable() {
  const [data, setData] = useState<Family[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Load families from API
  const loadData = async () => {
    console.log("function calling ring ring...");
    try {
      setLoading(true);
      const res = await getFamilies();
      console.log(res, "-----");
      setData(res.data || []);
    } catch (error) {
      console.error("Failed to load families", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Columns
  const columns: Column<Family>[] = [
    {
      key: "familyName",
      header: "Family Name",
      sortable: true,
      filterType: "text",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.familyName}</span>
          <span className="text-xs text-muted-foreground">{row.email}</span>
        </div>
      ),
    },
    {
      key: "familyTypeName",
      header: "Family Type",
      sortable: true,
      filterType: "text",
      render: (row) => <Badge>{row.familyTypeName || "-"}</Badge>,
    },
    {
      key: "teamCategoryName",
      header: "Team Category",
      sortable: true,
      filterType: null,
      render: (row) => row.teamCategoryName || "-",
    },
    {
      key: "identityTypeName",
      header: "Identity",
      sortable: true,
      filterType: "text",
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
      render: (row) => (
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
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  // Filter + Search
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = Object.values(item).some((val) =>
        String(val).toLowerCase().includes(search.toLowerCase())
      );
      if (!matchesSearch) return false;

      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const itemValue = item[key as keyof Family];
        return String(itemValue)
          .toLowerCase()
          .includes(String(value).toLowerCase());
      });
    });
  }, [data, search, filters]);

  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Delete Handler
  const handleDelete = async (id: number) => {
    const ok = confirm("Are you sure you want to delete this family?");
    if (!ok) return;
    try {
      await deleteFamily(id);
      setData((prev) => prev.filter((item) => item.familyId !== id));
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Family Management</h1>
        <p className="text-muted-foreground">
          Manage all families in your system using a dynamic table.
        </p>
      </div>

      <DataTable
        loading={loading}
        data={paginatedData}
        columns={columns}
        pagination={{
          page,
          limit: pageSize,
          total: filteredData.length,
          onPageChange: setPage,
        }}
        onSearchChange={setSearch}
        onFilterChange={(key, value) =>
          setFilters((prev) => ({ ...prev, [key]: value }))
        }
        onView={(row) => console.log("View", row)}
        onEdit={(row) => console.log("Edit", row)}
        onDelete={(id: any) => handleDelete(id)}
      />
    </div>
  );
}
