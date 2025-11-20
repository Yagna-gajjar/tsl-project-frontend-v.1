"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { SlidersHorizontal, X, Filter, ArrowUpDown, CalendarIcon } from "lucide-react"
import type { Column } from "./types"
import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface TableToolbarProps<T> {
	onSearch: (value: string) => void
	columns: Column<T>[]
	visibleColumns: Set<string>
	onColumnToggle: (key: string) => void
	filters: Record<string, any>
	onFilterChange: (key: string, value: any) => void
	sortConfig: { key: string; direction: "asc" | "desc" } | null
	onSortChange: (key: string, direction: "asc" | "desc") => void
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
}: TableToolbarProps<T>) {
	const [searchValue, setSearchValue] = useState("")

	const handleSearch = (value: string) => {
		setSearchValue(value)
		onSearch(value)
	}

	const handleReset = () => {
		setSearchValue("")
		onSearch("")
	}

	const activeFilterCount = Object.keys(filters).length

	const renderFilterInput = (column: Column<T>) => {
		if (!column.filterType) return null

		const value = filters[String(column.key)]

		switch (column.filterType) {
			case "number":
				return (
					<Input
						type="number"
						placeholder={`Filter ${column.header}...`}
						value={value || ""}
						onChange={(e) => onFilterChange(String(column.key), e.target.value)}
						className="h-8 w-full"
					/>
				)
			case "select":
				return (
					<Select
						value={value || "all"}
						onValueChange={(val) => onFilterChange(String(column.key), val === "all" ? "" : val)}
					>
						<SelectTrigger className="h-8 w-full">
							<SelectValue placeholder="All" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							{column.filterOptions?.map((opt) => (
								<SelectItem key={opt.value} value={String(opt.value)}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)
			case "date":
				return (
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className={cn("h-8 w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{value ? format(value, "PPP") : <span>Pick a date</span>}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={value}
								onSelect={(date) => onFilterChange(String(column.key), date)}
								initialFocus
							/>
						</PopoverContent>
					</Popover>
				)
			case "text":
				return (
					<Input
						placeholder={`Filter ${column.header}...`}
						value={value || ""}
						onChange={(e) => onFilterChange(String(column.key), e.target.value)}
						className="h-8 w-full"
					/>
				)
			default: 
				return null
		}
	}

	return (
		<div className="flex items-center justify-between py-4 gap-2">
			<div className="flex flex-1 items-center justify-between space-x-2">
				<div className="relative max-w-sm w-full">
					<Input
						placeholder="Search all columns..."
						value={searchValue}
						onChange={(e) => handleSearch(e.target.value)}
						className="h-9 w-[150px] lg:w-[250px] pr-8"
					/>
					{searchValue && (
						<button
							onClick={handleReset}
							className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</div>
				<div className="flex items-center gap-2">
				<Popover>
					<PopoverTrigger asChild>
						<Button variant="outline" size="sm" className="h-9 border-dashed bg-transparent">
							<Filter className="mr-2 h-4 w-4" />
							Filter
							{activeFilterCount > 0 && (
								<>
									<Separator orientation="vertical" className="mx-2 h-4" />
									<Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
										{activeFilterCount}
									</Badge>
									<div className="hidden space-x-1 lg:flex">
										{activeFilterCount > 2 ? (
											<Badge variant="secondary" className="rounded-sm px-1 font-normal">
												{activeFilterCount} selected
											</Badge>
										) : (
											columns
												.filter((col) => filters[String(col.key)])
												.map((col) => (
													<Badge variant="secondary" key={String(col.key)} className="rounded-sm px-1 font-normal">
														{col.header}
													</Badge>
												))
										)}
									</div>
								</>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[280px] p-4" align="start">
						<div className="space-y-4">
							<h4 className="font-medium leading-none">Filters</h4>
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
							{activeFilterCount > 0 && (
								<Button
									variant="ghost"
									className="w-full justify-center text-primary"
									onClick={() => {
										columns.forEach((col) => {
											if (col.filterType) onFilterChange(String(col.key), "")
										})
									}}
								>
									Clear filters
								</Button>
							)}
						</div>
					</PopoverContent>
				</Popover>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm" className="h-9 ml-2 bg-transparent">
							<ArrowUpDown className="mr-2 h-4 w-4" />
							Sort
							{sortConfig && (
								<>
									<Separator orientation="vertical" className="mx-2 h-4" />
									<Badge variant="secondary" className="rounded-sm px-1 font-normal">
										{columns.find((c) => String(c.key) === sortConfig.key)?.header}
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
								onSortChange(val, sortConfig?.key === val && sortConfig.direction === "asc" ? "desc" : "asc")
							}
						>
							{columns
								.filter((col) => col.sortable)
								.map((col) => (
									<DropdownMenuRadioItem key={String(col.key)} value={String(col.key)}>
										{col.header}
										{sortConfig?.key === String(col.key) && (
											<span className="ml-auto text-muted-foreground">
												{sortConfig.direction === "asc" ? " (Asc)" : " (Desc)"}
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
									onCheckedChange={(checked) => onSortChange(sortConfig.key, checked ? "asc" : "desc")}
								>
									Ascending
								</DropdownMenuCheckboxItem>
								<DropdownMenuCheckboxItem
									checked={sortConfig.direction === "desc"}
									onCheckedChange={(checked) => onSortChange(sortConfig.key, checked ? "desc" : "asc")}
								>
									Descending
								</DropdownMenuCheckboxItem>
								<DropdownMenuSeparator />
								<DropdownMenuCheckboxItem
									checked={false}
									onCheckedChange={() => onSortChange("", "asc")} // Hack to clear sort, ideally we'd have a clear button or handle null
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
						<Button variant="outline" size="sm" className="ml-auto h-9 flex bg-transparent">
							<SlidersHorizontal className="mr-2 h-4 w-4" />
							View
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-[150px]">
						<DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{columns.map((column) => {
							const columnKey = String(column.key)
							return (
								<DropdownMenuCheckboxItem
									key={columnKey}
									className="capitalize"
									checked={visibleColumns.has(columnKey)}
									onCheckedChange={() => onColumnToggle(columnKey)}
								>
									{column.header}
								</DropdownMenuCheckboxItem>
							)
						})}
					</DropdownMenuContent>
				</DropdownMenu>
				</div>
			</div>
		</div>
	)
}
