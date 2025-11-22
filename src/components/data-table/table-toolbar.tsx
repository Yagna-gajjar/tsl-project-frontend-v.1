"use client";

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
  onSearch: (value: string) => void;
  columns: Column<T>[];
  visibleColumns: Set<string>;
  onColumnToggle: (key: string) => void;
  filters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  onSortChange: (key: string, direction: "asc" | "desc") => void;
}

export function TableToolbar<T>({
  columns,
  visibleColumns,
  onColumnToggle,
  filters,
  onFilterChange,
  sortConfig,
  onSortChange,
}: TableToolbarProps<T>) {
  // local copy for filters so typing doesn't trigger parent immediately
  const [tempFilters, setTempFilters] = useState<Record<string, any>>(() => ({
    ...filters,
  }));
  const [showApply, setShowApply] = useState(false);

  // keep tempFilters in sync when parent filters change externally,
  // but only overwrite if parent filters actually differ from tempFilters.
  useEffect(() => {
    try {
      const parentStr = JSON.stringify(filters || {});
      const localStr = JSON.stringify(tempFilters || {});
      if (parentStr !== localStr) {
        // only overwrite when different (prevents wiping staged inputs right after Apply)
        setTempFilters({ ...filters });
        setShowApply(false);
      }
    } catch {
      // fallback sync if stringify fails for some reason
      setTempFilters({ ...filters });
      setShowApply(false);
    }
  }, [filters]); // intentional: only run when parent filters change

  // small debounce for showing the Apply button to avoid flicker while typing fast
  const showApplyTimer = useRef<number | null>(null);
  const debounceShowApply = () => {
    if (showApplyTimer.current) {
      clearTimeout(showApplyTimer.current);
    }
    // show apply after 250ms of typing
    showApplyTimer.current = window.setTimeout(() => {
      setShowApply(true);
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (showApplyTimer.current) clearTimeout(showApplyTimer.current);
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
            placeholder={`Filter ${column.header}...`}
            value={value ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setTempFilters((p) => ({ ...p, [key]: v }));
              if (v === "" || v === null || v === undefined) {
                // clear immediately (so user can clear without Apply if they want)
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
              // val is string from Select control. "all" means cleared.
              if (val === "all") {
                // remove from staged filters and clear parent
                setTempFilters((p) => {
                  const np = { ...p };
                  delete np[key];
                  return np;
                });
                onFilterChange(key, "");
                setShowApply(false);
                return;
              }

              // try to find the original option and preserve its original type (number/boolean/string)
              const opt = column.filterOptions?.find(
                (o) => String(o.value) === val
              );

              const applied = opt ? opt.value : val;

              // store typed value in tempFilters
              setTempFilters((p) => {
                const np = { ...p };
                np[key] = applied;
                return np;
              });
              console.log(key);

              // apply immediately for select (UX)
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
      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-8 w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(value, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value}
                onSelect={(date) => {
                  // set temp and show apply (dates usually require explicit apply)
                  setTempFilters((p) => ({ ...p, [key]: date }));
                  debounceShowApply();
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      case "text":
        return (
          <Input
            placeholder={`Filter ${column.header}...`}
            value={value ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setTempFilters((p) => ({ ...p, [key]: v }));
              if (v === "" || v === null || v === undefined) {
                // clear immediately
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
    // Only send differences between tempFilters and the parent's filters prop
    // 1) send/update keys present in tempFilters that changed value
    // 2) clear keys that are present in parent filters but removed from tempFilters

    // shallow compare keys and values
    const parent = filters || {};
    const staged = tempFilters || {};

    // send updates / additions
    Object.entries(staged).forEach(([k, v]) => {
      const prev = parent[k];
      // treat Date objects specially by comparing ISO if needed
      const changed =
        prev === undefined
          ? true
          : prev instanceof Date && v instanceof Date
          ? prev.getTime() !== v.getTime()
          : String(prev) !== String(v);

      if (changed) {
        onFilterChange(k, v ?? "");
      }
    });

    // clear removals (only for keys that actually existed before)
    Object.keys(parent).forEach((k) => {
      if (!(k in staged)) {
        onFilterChange(k, "");
      }
    });

    // Keep tempFilters as current (do not clear) so reopening shows applied values.
    setTempFilters((p) => ({ ...p }));
    setShowApply(false);
  };

  const cancelFilters = () => {
    // revert temp filters back to actual applied filters
    setTempFilters({ ...filters });
    setShowApply(false);
  };

  const clearAllFilters = () => {
    // reset both temp and parent immediately
    const filterKeys = columns
      .filter((col) => col.filterType)
      .map((col) => String(col.key));
    // only clear keys that are actually set in parent to avoid extra calls
    filterKeys.forEach((k) => {
      if (filters && k in filters) onFilterChange(k, "");
    });
    setTempFilters({});
    setShowApply(false);
  };

  return (
    <div className="flex items-center justify-between py-4 gap-2">
      <div className="flex flex-1 items-center justify-between space-x-2">
        <div className="flex items-center gap-2">
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
        </div>
      </div>
    </div>
  );
}
