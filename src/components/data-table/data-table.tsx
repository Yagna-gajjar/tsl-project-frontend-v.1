import { exportToExcel } from "@/lib/export-to-excel";
import { useState, useMemo } from "react";
import type { DynamicTableProps } from "./types";
import { TablePagination } from "./table-pagination";
import { TableToolbar } from "./table-toolbar/table-toolbar";
import { TableMobileCard } from "./table-mobile-card";
import { toast } from "@/hooks/use-toast";
import DesktopTable from "./desktop-table";

export function DataTable<T>({
  data,
  columns,
  pagination,
  isLoading,
  onSearchChange,
  onFilterChange,
  onSortChange,
  onView,
  onEdit,
  onDelete,
  onPrint,
  onCopy,
  idKey = "id" as keyof T,
  exportFileName,
  onExport,
}: DynamicTableProps<T>) {

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.filter((c) => !c.hidden).map((c) => String(c.key)))
  );
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [filters, setFilters] = useState<
    Record<string, string | number | Date | object | boolean | undefined>
  >({});
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!onExport || isExporting) return;

    try {
      setIsExporting(true);

      toast({
        title: "Export started",
        description: "Preparing data for export...",
      });

      const allRows = await onExport();

      if (!allRows || !allRows.length) {
        toast({
          title: "Info",
          description: "No data to export",
        });
        return;
      }

      const allKeys = Array.from(
        new Set(
          allRows.flatMap((row) => Object.keys(row as Record<string, string>))
        )
      );

      const exportColumns = allKeys.map((key) => ({
        key,
        header: key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (c) => c.toUpperCase()),
      }));

      exportToExcel(
        allRows as Record<string, unknown>[],
        exportColumns as { key: string; header: string; }[],
        exportFileName || "Export"
      );

      toast({
        title: "Export completed",
        description: "Your file has been downloaded successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Export failed",
        description: "Something went wrong while exporting data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleColumnToggle = (key: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(key)) {
      newVisible.delete(key);
    } else {
      newVisible.add(key);
    }
    setVisibleColumns(newVisible);
  };

  const handleSort = (key: string, direction?: "asc" | "desc") => {
    if (!key) {
      setSortConfig(null);
      onSortChange?.("", "ASC");
      return;
    }

    let newDirection: "asc" | "desc" = direction || "asc";
    if (
      !direction &&
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      newDirection = "desc";
    }
    setSortConfig({ key, direction: newDirection });
    onSortChange?.(key, newDirection === "asc" ? "ASC" : "DESC");
  };

  const sendFilterChange = (key: string, value: string | number | Date | object | boolean) => {
    onFilterChange?.(key, value);
  };

  const handleFilter = (key: string, value: string | number | Date | object | boolean) => {
    const newFilters = { ...filters };
    if (value === "" || value === null || value === undefined) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    setFilters(newFilters);
    sendFilterChange(key, value);
  };

  const displayColumns = useMemo(
    () => columns.filter((col) => visibleColumns.has(String(col.key))),
    [columns, visibleColumns]
  );

  if (!columns || columns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No columns configured
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data.length && !isLoading) {
    return (
      <div className="w-full space-y-4">
        <TableToolbar
          onSearch={onSearchChange || (() => { })}
          columns={columns}
          visibleColumns={visibleColumns}
          onColumnToggle={handleColumnToggle}
          filters={filters as Record<string, string | number | Date>}
          onFilterChange={handleFilter}
          sortConfig={sortConfig}
          onSortChange={handleSort}
        />
        <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-muted/10">
          <div className="text-muted-foreground text-lg">No data available</div>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search or filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 w-full">
        <TableToolbar
          onSearch={onSearchChange || (() => { })}
          columns={columns}
          visibleColumns={visibleColumns}
          onColumnToggle={handleColumnToggle}
          filters={filters as Record<string, string | number | Date>}
          onFilterChange={handleFilter}
          sortConfig={sortConfig}
          onSortChange={handleSort}
          onExport={onExport ? handleExport : undefined}
          isExporting={isExporting}
        />

        <div className="hidden md:block rounded-md border shadow-sm bg-card">
          <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
            <DesktopTable
              displayColumns={displayColumns}
              idKey={idKey}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onCopy={onCopy}
              onPrint={onPrint}
              data={data}
            />
          </div>
        </div>
      </div>

      <TableMobileCard
        data={data}
        columns={displayColumns}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        idKey={idKey}
      />
      {pagination && <TablePagination pagination={pagination} />}
    </>
  );
}
