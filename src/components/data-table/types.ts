import type { ReactNode } from "react";

export type FilterType = "text" | "number" | "select" | "date" | null;

export interface Column<T> {
  key: keyof T | string;
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
  pagination?: any;
  isLoading?: boolean;

  onSearchChange?: (value: string) => void;
  onFilterChange?: (key: string, value: any) => void;
  onSortChange?: (key: string, direction: "ASC" | "DESC") => void;

  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onCopy?: (row: T) => void;
  onDelete?: (id: any) => void;
  onPrint?: (id: T) => void;

  idKey?: keyof T;

  onExport?: () => Promise<T[]>;
  exportFileName?: string;
}
