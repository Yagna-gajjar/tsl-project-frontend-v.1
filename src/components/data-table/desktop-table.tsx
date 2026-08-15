import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Copy, Eye, Pencil, Trash2, Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { DesktopTableProps } from './types';

export default function DesktopTable<T>({
  displayColumns,
  idKey,
  onView,
  onEdit,
  onDelete,
  onCopy,
  onPrint,
  data
}: DesktopTableProps<T>) {

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


  return (
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
              key={String((row as T)[idKey] || index)}
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
                  : String((row as T)[col.key] ?? "");

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
                        onClick={() => onDelete(String((row as T)[idKey]))}
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
  )
}
