import type React from "react";
import { exportToExcel } from "@/lib/export-to-excel";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, Eye, Pencil, Trash2, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DynamicTableProps } from "./types";
import { TablePagination } from "./table-pagination";
import { TableToolbar } from "./table-toolbar";
import { TableMobileCard } from "./table-mobile-card";
import { toast } from "@/hooks/use-toast";

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
    Record<string, string | number | Date | Object | boolean | undefined>
  >({});
  const [isExporting, setIsExporting] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const resizingColumn = useRef<string | null>(null);
  const startX = useRef<number>(0);
  const startWidth = useRef<number>(0);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [columnWidths]);

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

      // 🔥 Collect ALL keys from API response
      const allKeys = Array.from(
        new Set(
          allRows.flatMap((row) => Object.keys(row as Record<string, any>))
        )
      );

      const exportColumns = allKeys.map((key) => ({
        key,
        header: key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (c) => c.toUpperCase()),
      }));

      exportToExcel(
        allRows as any[],
        exportColumns as any[],
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

  const sendFilterChange = (key: string, value: any) => {
    onFilterChange?.(key, value);
  };

  const handleFilter = (key: string, value: any) => {
    // Dates are serialised here so consumers (and the query string) always see
    // a plain "yyyy-MM-dd" value instead of a locale-specific Date.toString().
    const normalized = value instanceof Date ? format(value, "yyyy-MM-dd") : value;

    const newFilters = { ...filters };
    if (normalized === "" || normalized === null || normalized === undefined) {
      delete newFilters[key];
    } else {
      newFilters[key] = normalized;
    }
    setFilters(newFilters);
    sendFilterChange(key, normalized === "" ? undefined : normalized);
  };

  const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    resizingColumn.current = columnKey;
    startX.current = e.clientX;
    startWidth.current = columnWidths[columnKey] || 150;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingColumn.current) return;

    const diff = e.clientX - startX.current;
    const newWidth = Math.max(40, startWidth.current + diff);

    setColumnWidths((prev) => ({
      ...prev,
      [resizingColumn.current!]: newWidth,
    }));
  };

  const handleMouseUp = () => {
    resizingColumn.current = null;
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

  // The toolbar is rendered from a single place in a stable position so that
  // loading/empty transitions never unmount it — remounting it used to close
  // the filter popover and drop input focus on every keystroke-driven fetch.
  const toolbar = (
    <TableToolbar
      onSearch={onSearchChange}
      columns={columns}
      visibleColumns={visibleColumns}
      onColumnToggle={handleColumnToggle}
      filters={filters as any}
      onFilterChange={handleFilter}
      sortConfig={sortConfig}
      onSortChange={handleSort}
      onExport={onExport ? handleExport : undefined}
      isExporting={isExporting}
    />
  );

  if (isLoading || !data.length) {
    return (
      <div className="space-y-4 w-full">
        {toolbar}
        {isLoading ? (
          <div className="w-full h-96 flex items-center justify-center rounded-md border bg-card">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-muted/10">
            <div className="text-muted-foreground text-lg">
              No data available
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {toolbar}

      <>
        <div className="hidden md:block rounded-md border shadow-sm bg-card">
          <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
            <Table>
              <TableHeader className="bg-blue-50 dark:bg-blue-950/50">
                <TableRow className="">
                  {displayColumns.map((col, idx) => (
                    <TableHead
                      key={String(col.key)}
                      className={cn(
                        "sticky font-semibold text-blue-900 dark:text-blue-100 border-r border-border",
                        col.align === "center" && "text-center",
                        col.align === "right" && "text-right"
                      )}
                      style={{
                        width:
                          columnWidths[String(col.key)] || col.width || 150,
                        maxWidth:
                          columnWidths[String(col.key)] || col.width || 150,
                      }}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="truncate">{col.header}</span>
                      </div>
                      {idx < displayColumns.length - 1 && (
                        <div
                          onMouseDown={(e) =>
                            handleMouseDown(e, String(col.key))
                          }
                          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-400 dark:hover:bg-blue-600 bg-border/30 hover:opacity-100 transition-opacity z-10"
                          style={{ userSelect: "none" }}
                        />
                      )}
                    </TableHead>
                  ))}
                  {(onView || onEdit || onDelete) && (
                    <TableHead className="w-[100px] text-right font-semibold text-blue-900 dark:text-blue-100">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="wait">
                  {data.map((row, index) => (
                    <motion.tr
                      key={String((row as any)[idKey] || index)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className={cn(
                        "group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors border-b border-border",
                        index % 2 === 0
                          ? "bg-background"
                          : "bg-slate-50/50 dark:bg-muted/5"
                      )}
                    >
                      {displayColumns.map((col) => {
                        const cellContent = col.render
                          ? col.render(row)
                          : String((row as any)[col.key] ?? "");

                        return (
                          <TableCell
                            key={String(col.key)}
                            className={cn(
                              "border-r px-2 border-border overflow-hidden",
                              col.align === "center" && "text-center",
                              col.align === "right" && "text-right"
                            )}
                            style={{
                              width:
                                columnWidths[String(col.key)] ||
                                col.width ||
                                150,
                              maxWidth:
                                columnWidths[String(col.key)] ||
                                col.width ||
                                150,
                            }}
                            title={
                              typeof cellContent === "string"
                                ? cellContent
                                : undefined
                            }
                          >
                            <div className="truncate">{cellContent}</div>
                          </TableCell>
                        );
                      })}
                      {(onView || onEdit || onDelete || onCopy || onPrint) && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onPrint && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                                onClick={() => onPrint(row)}
                                title="Copy to New Member"
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            )}
                            {onView && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                onClick={() => onView(row)}
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}

                            {/* NEW COPY BUTTON */}
                            {onCopy && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                                onClick={() => onCopy(row)}
                                title="Copy to New Member"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                                onClick={() => onEdit(row)}
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}

                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                                onClick={() => onDelete((row as any)[idKey])}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
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
    </div>
  );
}
