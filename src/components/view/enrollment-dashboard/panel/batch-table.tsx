// batch-table.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Batch } from "@/types/batch"

interface BatchTableProps {
    batchData: Batch[]
}

export default function BatchTable({ batchData }: BatchTableProps) {
    return (
        <div className="w-full border rounded-md bg-background shadow-sm">
            <Table className="min-w-[800px]"> {/* Ensure it doesn't squish too much */}
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    <TableRow>
                        <TableHead className="font-bold text-[11px] uppercase">Course Name</TableHead>
                        <TableHead className="font-bold text-[11px] uppercase">Batch Name</TableHead>
                        <TableHead className="font-bold text-[11px] uppercase">Capacity</TableHead>
                        <TableHead className="font-bold text-[11px] uppercase text-right">Criteria</TableHead>
                        <TableHead className="font-bold text-[11px] uppercase text-right">Start Time</TableHead>
                        <TableHead className="font-bold text-[11px] uppercase text-right">End Time</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {batchData && batchData.length > 0 ? (
                        batchData.map((batch, index) => (
                            <TableRow key={batch.batchId || index} className="hover:bg-muted/30">
                                <TableCell className="font-medium text-sm">
                                    {batch.courseName || "General / No Course"}
                                </TableCell>
                                <TableCell className="text-sm">{batch.batchName}</TableCell>
                                <TableCell className="text-sm">
                                    <span className="px-2 py-0.5 bg-secondary rounded-full text-xs">
                                        {batch.maxCapacity || 0}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                    {batch.admissionCriteria || "Open"}
                                </TableCell>
                                <TableCell className="text-right text-sm font-mono">
                                    {batch.startTime || "N/A"}
                                </TableCell>
                                <TableCell className="text-right text-sm font-mono">
                                    {batch.endTime || "N/A"}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                                No batch data available for the selected filters.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}