import type { Dispatch, ReactNode, SetStateAction } from "react";

export type FilterType = "text" | "number" | "select" | "date" | null;

export interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  filterType?: FilterType;
  filterOptions?: { label: string; value: string | number }[];
  /** Overrides the default "Filter <header>..." placeholder on text/number filters. */
  filterPlaceholder?: string;
  render?: (row: T) => ReactNode;
  width?: number | string;
  align?: "left" | "center" | "right";
  hidden?: boolean;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export interface DynamicTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pagination?: PaginationState;
  isLoading?: boolean;

  onSearchChange?: (value: string) => void;
  onFilterChange?: (
    key: string,
    value: string | number | Date | object | boolean,
  ) => void;
  onSortChange?: (key: string, direction: "ASC" | "DESC") => void;

  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onCopy?: (row: T) => void;
  onDelete?: (id: string) => void;
  onPrint?: (row: T) => void;

  idKey?: keyof T;

  onExport?: () => Promise<T[]>;
  exportFileName?: string;
}

export interface TableMobileCardProps<T> {
  data: T[];
  columns: Column<T>[];
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (id: string) => void;
  idKey?: keyof T;
}

export interface DesktopTableProps<T> {
  displayColumns: Column<T>[];
  idKey: keyof T;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (id: string) => void;
  onCopy?: (row: T) => void;
  onPrint?: (row: T) => void;
  data: T[];
}

export interface TableToolbarProps<T> {
  onSearch: (value: string) => void;
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

export interface FilterToolProps<T> {
  columns: Column<T>[];
  filters: Record<string, string | number | Date>;
  onFilterChange: (key: string, value: string | number | Date) => void;
}

export interface FilterInputProps<T> {
  column: Column<T>;
  setTempFilters: Dispatch<
    SetStateAction<
      Record<string, string | number | boolean | object | Date | undefined>
    >
  >;
  setShowApply: Dispatch<SetStateAction<boolean>>;
  onFilterChange: (key: string, value: string | number | Date) => void;
  tempFilters: Record<
    string,
    string | number | boolean | object | Date | undefined
  >;
}
