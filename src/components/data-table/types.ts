import type { ReactNode } from "react"

export type FilterType = "text" | "number" | "select" | "date" | null

export interface Column<T> {
	key: keyof T | string
	header: string
	sortable?: boolean
	filterType?: FilterType
	filterOptions?: { label: string; value: string | number }[] // For select filter
	render?: (row: T) => ReactNode
	width?: number | string
	align?: "left" | "center" | "right"
	hidden?: boolean
}

export interface PaginationState {
	page: number
	limit: number
	total: number
	onPageChange?: (page: number) => void
	onPageSizeChange?: (pageSize: number) => void // Added onPageSizeChange for page size dropdown
}

export interface DynamicTableProps<T> {
	data: T[]
	columns: Column<T>[]
	pagination?: PaginationState
	isLoading?: boolean
	onSearchChange?: (value: string) => void
	onFilterChange?: (key: string, value: any) => void
	onSortChange?: (key: string, direction: "asc" | "desc") => void
	onView?: (row: T) => void
	onEdit?: (row: T) => void
	onDelete?: (id: string | number) => void
	// Helper to extract ID for delete action if not provided in a specific way
	idKey?: keyof T
}
