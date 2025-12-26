import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2 } from "lucide-react"
import type { Column } from "./types"
import { motion } from "framer-motion"

interface TableMobileCardProps<T> {
	data: T[];
	columns: Column<T>[];
	onView?: (row: T) => void;
	onEdit?: (row: T) => void;
	onDelete?: (id: number | undefined) => void;
	idKey?: keyof T;
}

export function TableMobileCard<T>({
	data,
	columns,
	onView,
	onEdit,
	onDelete,
	idKey = "id" as keyof T,
}: TableMobileCardProps<T>) {
	return (
		<div className="grid gap-4 md:hidden">
			{data.map((row:any, index: number) => (
				<motion.div
					key={String((row)[idKey] || index)}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: index * 0.05 }}
				>
					<Card className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
						<CardHeader className="bg-muted/20 p-4 pb-2">
							<div className="flex justify-between items-start">
								<CardTitle className="text-lg font-semibold text-blue-900 dark:text-blue-100">
									{columns[0]?.render ? columns[0].render(row) : String((row)[columns[0]?.key])}
								</CardTitle>
								<div className="flex gap-1">
									{onView && (
										<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(row)}>
											<Eye className="h-4 w-4 text-blue-600" />
										</Button>
									)}
									{onEdit && (
										<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(row)}>
											<Pencil className="h-4 w-4 text-amber-600" />
										</Button>
									)}
									{onDelete && (
										<Button
											variant="ghost"
											size="icon"
											className="h-8 w-8"
											onClick={() => onDelete((row)[idKey])}
										>
											<Trash2 className="h-4 w-4 text-red-600" />
										</Button>
									)}
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-4 pt-2 grid gap-2">
							{columns.slice(1).map((col) => (
								<div
									key={String(col.key)}
									className="flex justify-between items-center py-1 border-b last:border-0 border-dashed border-gray-100 dark:border-gray-800"
								>
									<span className="text-sm font-medium text-muted-foreground">{col.header}</span>
									<span className="text-sm font-medium text-right">
										{col.render ? col.render(row) : String((row)[col.key] ?? "")}
									</span>
								</div>
							))}
						</CardContent>
					</Card>
				</motion.div>
			))}
		</div>
	)
}
