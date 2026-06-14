import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  SlidersHorizontal,
  ArrowUpDown,
  Download,
} from "lucide-react";
import type { TableToolbarProps } from "../types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import FilterTool from "./filter-tool";

export function TableToolbar<T>({
  columns,
  visibleColumns,
  onColumnToggle,
  filters,
  onFilterChange,
  sortConfig,
  onSortChange,
  onExport,
  isExporting,
}: TableToolbarProps<T>) {
  return (
    <div className="flex items-center justify-between py-4 gap-2">
      <div className="flex flex-1 items-center justify-between space-x-2">
        <div className="flex items-center gap-2">
          <FilterTool columns={columns} filters={filters} onFilterChange={onFilterChange} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 ml-2 bg-transparent"
              >
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Sort
                {sortConfig && (
                  <>
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    <Badge
                      variant="secondary"
                      className="rounded-sm px-1 font-normal"
                    >
                      {
                        columns.find((c) => String(c.key) === sortConfig.key)
                          ?.header
                      }
                      {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                    </Badge>
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={sortConfig?.key}
                onValueChange={(val) =>
                  onSortChange(
                    val,
                    sortConfig?.key === val && sortConfig.direction === "asc"
                      ? "desc"
                      : "asc"
                  )
                }
              >
                {columns
                  .filter((col) => col.sortable)
                  .map((col) => (
                    <DropdownMenuRadioItem
                      key={String(col.key)}
                      value={String(col.key)}
                    >
                      {col.header}
                      {sortConfig?.key === String(col.key) && (
                        <span className="ml-auto text-muted-foreground">
                          {sortConfig.direction === "asc"
                            ? " (Asc)"
                            : " (Desc)"}
                        </span>
                      )}
                    </DropdownMenuRadioItem>
                  ))}
              </DropdownMenuRadioGroup>
              {sortConfig && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={sortConfig.direction === "asc"}
                    onCheckedChange={(checked) =>
                      onSortChange(sortConfig.key, checked ? "asc" : "desc")
                    }
                  >
                    Ascending
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sortConfig.direction === "desc"}
                    onCheckedChange={(checked) =>
                      onSortChange(sortConfig.key, checked ? "desc" : "asc")
                    }
                  >
                    Descending
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={false}
                    onCheckedChange={() => onSortChange("", "asc")}
                    className="text-red-500 focus:text-red-500"
                  >
                    Clear Sort
                  </DropdownMenuCheckboxItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto h-9 flex bg-transparent"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => {
                const columnKey = String(column.key);
                return (
                  <DropdownMenuCheckboxItem
                    key={columnKey}
                    className="capitalize"
                    checked={visibleColumns.has(columnKey)}
                    onCheckedChange={() => onColumnToggle(columnKey)}
                  >
                    {column.header}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {onExport && (
            <Button
              size="sm"
              onClick={onExport}
              disabled={isExporting}
              className={cn(
                "h-9 gap-2 text-white shadow-sm",
                "bg-gradient-to-r from-blue-600 to-indigo-600",
                "hover:from-blue-700 hover:to-indigo-700",
                "disabled:from-blue-400 disabled:to-indigo-400"
              )}
            >
              {isExporting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  Exporting…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          )}

        </div>
      </div>
    </div>
  );
}
