import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Batch } from "@/types/batch"

interface BatchTableProps {
    batchData: Batch[]
}

export default function BatchTable({ batchData }: BatchTableProps) {
    return (
        <div className="rounded-md border overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="font-bold">CourseName</TableHead>
                        <TableHead className="font-bold">Batch Name</TableHead>
                        <TableHead className="font-bold">NoOfPerson</TableHead>
                        <TableHead className="font-bold text-right">AdmitInstruction</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {batchData.length > 0 ? (
                        batchData.map((batch, index) => (
                            <TableRow key={batch.batchId || index}>
                                <TableCell className="font-medium">{batch.courseName}</TableCell>
                                <TableCell className="font-medium">{batch.batchName}</TableCell>
                                <TableCell>{batch.maxCapacity || 0}</TableCell>
                                <TableCell className="text-right">{batch.startTime || "N/A"}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                No batch data available.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
