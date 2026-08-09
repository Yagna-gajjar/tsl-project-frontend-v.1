import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Filter,
  ArrowUpDown,
  CalendarIcon,
  Download,
  Search,
  X,
} from "lucide-react";
import type { Column } from "./types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TableToolbarProps<T> {
  onSearch?: (value: string) => void;
  columns: Column<T>[];
  visibleColumns: Set<string>;
  onColumnToggle: (key: string) => void;
  filters: Record<string, string | number | Date>;
  onFilterChange: (key: string, value: string | number | Date) => void;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  onSortChange: (key: string, direction: "asc" | "desc") => void;
  onExport?: () => void;
  isExporting?: boolean;
}

/**
 * Filter values travel to the parent as plain strings (dates as "yyyy-MM-dd"),
 * so the calendar control has to re-hydrate whatever it is handed back.
 */
function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value;

  const raw = String(value);

  // "yyyy-MM-dd" must be read as a local calendar day. new Date() would treat
  // it as UTC midnight, which lands on the previous day west of Greenwich.
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (parts) {
    return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
  }

  const d = new Date(raw);
  return isNaN(d.getTime()) ? undefined : d;
}

export function TableToolbar<T>({
  onSearch,
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
  const [tempFilters, setTempFilters] = useState<Record<string, string | number | Date | Object | boolean>>(() => ({
    ...filters,
  }));
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    try {
      const parentStr = JSON.stringify(filters || {});
      const localStr = JSON.stringify(tempFilters || {});
      if (parentStr !== localStr) {
        setTempFilters({ ...filters });
        setShowApply(false);
      }
    } catch {
      setTempFilters({ ...filters });
      setShowApply(false);
    }
  }, [filters]);

  const showApplyTimer = useRef<number | null>(null);
  const debounceShowApply = () => {
    if (showApplyTimer.current) {
      clearTimeout(showApplyTimer.current);
    }
    showApplyTimer.current = window.setTimeout(() => {
      setShowApply(true);
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (showApplyTimer.current) clearTimeout(showApplyTimer.current);
    };
  }, []);

  const [searchValue, setSearchValue] = useState("");
  const searchTimer = useRef<number | null>(null);

  const pushSearch = (value: string) => {
    setSearchValue(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      onSearch?.(value.trim());
    }, 350);
  };

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const activeFilterCount = Object.keys(filters).length;

  const renderFilterInput = (column: Column<T>) => {
    if (!column.filterType) return null;

    const key = String(column.key);
    const value = tempFilters[key];

    switch (column.filterType) {
      case "number":
        return (
          <Input
            type="number"
            placeholder={column.filterPlaceholder ?? `Filter ${column.header}...`}
            value={value as any ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setTempFilters((p) => ({ ...p, [key]: v }));
              if (v === "" || v === null || v === undefined) {
                setTempFilters((p) => {
                  const np = { ...p };
                  delete np[key];
                  return np;
                });
                onFilterChange(key, "");
                setShowApply(false);
                return;
              }
              debounceShowApply();
            }}
            className="h-8 w-full"
          />
        );
      case "select": {
        const key = String(column.key);
        const controlValue =
          key in tempFilters ? String(tempFilters[key]) : "all";

        return (
          <Select
            value={controlValue}
            onValueChange={(val) => {
              if (val === "all") {
                setTempFilters((p) => {
                  const np = { ...p };
                  delete np[key];
                  return np;
                });
                onFilterChange(key, "");
                setShowApply(false);
                return;
              }

              const opt = column.filterOptions?.find(
                (o) => String(o.value) === val
              );

              const applied = opt ? opt.value : val;

              setTempFilters((p) => {
                const np = { ...p };
                np[key] = applied;
                return np;
              });

              onFilterChange(key, applied);
              setShowApply(false);
            }}
          >
            <SelectTrigger className="h-8 w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {column.filterOptions?.map((opt) => (
                <SelectItem key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      case "date": {
        const selectedDate = toDate(value);
        return (
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-8 flex-1 justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "dd MMM yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (!date) return;
                    setTempFilters((p: any) => ({ ...p, [key]: date }));
                    debounceShowApply();
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {selectedDate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                title={`Clear ${column.header}`}
                onClick={() => {
                  setTempFilters((p) => {
                    const np = { ...p };
                    delete np[key];
                    return np;
                  });
                  onFilterChange(key, "");
                  setShowApply(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      }
      case "text":
        return (
          <Input
            placeholder={column.filterPlaceholder ?? `Filter ${column.header}...`}
            value={value as any ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setTempFilters((p) => ({ ...p, [key]: v }));
              if (v === "" || v === null || v === undefined) {
                setTempFilters((p) => {
                  const np = { ...p };
                  delete np[key];
                  return np;
                });
                onFilterChange(key, "");
                setShowApply(false);
                return;
              }
              debounceShowApply();
            }}
            className="h-8 w-full"
          />
        );
      default:
        return null;
    }
  };

  const applyFilters = () => {
    const parent = filters || {};
    const staged = tempFilters || {};

    Object.entries(staged).forEach(([k, v]) => {
      const prev = parent[k];
      const changed =
        prev === undefined
          ? true
          : prev instanceof Date && v instanceof Date
            ? prev.getTime() !== v.getTime()
            : String(prev) !== String(v);

      if (changed) {
        onFilterChange(k, v as any ?? "");
      }
    });

    Object.keys(parent).forEach((k) => {
      if (!(k in staged)) {
        onFilterChange(k, "");
      }
    });

    setTempFilters((p) => ({ ...p }));
    setShowApply(false);
  };

  const cancelFilters = () => {
    setTempFilters({ ...filters });
    setShowApply(false);
  };

  const clearAllFilters = () => {
    const filterKeys = columns
      .filter((col) => col.filterType)
      .map((col) => String(col.key));
    filterKeys.forEach((k) => {
      if (filters && k in filters) onFilterChange(k, "");
    });
    setTempFilters({});
    setShowApply(false);
  };

  return (
    <div className="flex items-center justify-between py-4 gap-2">
      <div className="flex flex-1 items-center justify-between space-x-2">
        <div className="flex flex-wrap items-center gap-2">
          {onSearch && (
            <div className="relative w-[200px] lg:w-[260px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(e) => pushSearch(e.target.value)}
                placeholder="Search..."
                className="h-9 pl-8 pr-8"
              />
              {searchValue && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => pushSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-dashed bg-transparent"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter
                {activeFilterCount > 0 && (
                  <>
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    <Badge
                      variant="secondary"
                      className="rounded-sm px-1 font-normal lg:hidden"
                    >
                      {activeFilterCount}
                    </Badge>
                    <div className="hidden space-x-1 lg:flex">
                      {activeFilterCount > 2 ? (
                        <Badge
                          variant="secondary"
                          className="rounded-sm px-1 font-normal"
                        >
                          {activeFilterCount} selected
                        </Badge>
                      ) : (
                        columns
                          .filter((col) => filters[String(col.key)])
                          .map((col) => (
                            <Badge
                              variant="secondary"
                              key={String(col.key)}
                              className="rounded-sm px-1 font-normal"
                            >
                              {col.header}
                            </Badge>
                          ))
                      )}
                    </div>
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="max-w-[320px] max-h-[400px] p-4 overflow-auto"
              align="start"
            >
              <div className="space-y-4">
                <div className="font-medium flex justify-between items-center leading-none">
                  <span>Filters </span>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      className="w-1/2 bg-blue-100 justify-center text-blue-600"
                      onClick={clearAllFilters}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
                <div className="space-y-4">
                  {columns
                    .filter((col) => col.filterType)
                    .map((col) => (
                      <div key={String(col.key)} className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {col.header}
                        </label>
                        {renderFilterInput(col)}
                      </div>
                    ))}
                </div>

                <div className="flex gap-2">
                  {showApply ? (
                    <>
                      <Button className="flex-1" onClick={applyFilters}>
                        Apply
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex-1"
                        onClick={cancelFilters}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <div className="flex-1" />
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

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
