"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import type { DynamicTableProps } from "./types"
import { TablePagination } from "./table-pagination"
import { TableToolbar } from "./table-toolbar"
import { TableMobileCard } from "./table-mobile-card"

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
	idKey = "id" as keyof T,
}: DynamicTableProps<T>) {
	const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
		new Set(columns.filter((c) => !c.hidden).map((c) => String(c.key))),
	)
	const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
	const [filters, setFilters] = useState<Record<string, any>>({})

	// Handle column visibility toggle
	const handleColumnToggle = (key: string) => {
		const newVisible = new Set(visibleColumns)
		if (newVisible.has(key)) {
			newVisible.delete(key)
		} else {
			newVisible.add(key)
		}
		setVisibleColumns(newVisible)
	}

	// Handle sorting
	const handleSort = (key: string, direction?: "asc" | "desc") => {
		if (!key) {
			setSortConfig(null)
			onSortChange?.("", "asc") // Clear sort
			return
		}

		let newDirection: "asc" | "desc" = direction || "asc"
		if (!direction && sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
			newDirection = "desc"
		}
		setSortConfig({ key, direction: newDirection })
		onSortChange?.(key, newDirection)
	}

	// Handle filtering
	const handleFilter = (key: string, value: any) => {
		const newFilters = { ...filters, [key]: value }
		if (value === "" || value === null || value === undefined) {
			delete newFilters[key]
		}
		setFilters(newFilters)
		onFilterChange?.(key, value)
	}

	// Filter visible columns
	const displayColumns = useMemo(
		() => columns.filter((col) => visibleColumns.has(String(col.key))),
		[columns, visibleColumns],
	)

	if (isLoading) {
		return (
			<div className="w-full h-96 flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
			</div>
		)
	}

	if (!data.length && !isLoading) {
		return (
			<div className="w-full space-y-4">
				<TableToolbar
					onSearch={onSearchChange || (() => { })}
					columns={columns}
					visibleColumns={visibleColumns}
					onColumnToggle={handleColumnToggle}
					filters={filters}
					onFilterChange={handleFilter}
					sortConfig={sortConfig}
					onSortChange={handleSort}
				/>
				<div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-muted/10">
					<div className="text-muted-foreground text-lg">No data available</div>
					<p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters</p>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-4 w-full">
			<TableToolbar
				onSearch={onSearchChange || (() => { })}
				columns={columns}
				visibleColumns={visibleColumns}
				onColumnToggle={handleColumnToggle}
				filters={filters}
				onFilterChange={handleFilter}
				sortConfig={sortConfig}
				onSortChange={handleSort}
			/>

			{/* Desktop View */}
			<div className="hidden md:block rounded-md border shadow-sm bg-card overflow-hidden">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-background sticky top-0 z-10">
							<TableRow>
								{displayColumns.map((col) => (
									<TableHead
										key={String(col.key)}
										className={cn(
											"whitespace-nowrap p-4 font-semibold text-blue-900 dark:text-blue-100",
											col.align === "center" && "text-center",
											col.align === "right" && "text-right",
										)}
										style={{ width: col.width }}
									>
										<div className="flex items-center gap-2">{col.header}</div>
									</TableHead>
								))}
								{(onView || onEdit || onDelete) && (
									<TableHead className="w-[100px] text-right p-4 font-semibold text-blue-900 dark:text-blue-100">
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
											"group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors",
											index % 2 === 0 ? "bg-white dark:bg-background" : "bg-slate-50/50 dark:bg-muted/5",
										)}
									>
										{displayColumns.map((col) => (
											<TableCell
												key={String(col.key)}
												className={cn(
													"p-4",
													col.align === "center" && "text-center",
													col.align === "right" && "text-right",
												)}
											>
												{col.render ? col.render(row) : String((row as any)[col.key] ?? "")}
											</TableCell>
										))}
										{(onView || onEdit || onDelete) && (
											<TableCell className="text-right p-4">
												<div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
													{onView && (
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
															onClick={() => onView(row)}
														>
															<Eye className="h-4 w-4" />
														</Button>
													)}
													{onEdit && (
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-100"
															onClick={() => onEdit(row)}
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

			{/* Mobile View */}
			<TableMobileCard
				data={data}
				columns={displayColumns}
				onView={onView}
				onEdit={onEdit}
				onDelete={onDelete}
				idKey={idKey}
			/>

			{/* Pagination */}
			{pagination && <TablePagination pagination={pagination} />}
		</div>
	)
}
