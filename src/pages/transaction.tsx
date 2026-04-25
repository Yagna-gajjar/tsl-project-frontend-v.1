import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import type { Transaction } from "@/types/transaction";
import TransactionTable from "@/components/view/transaction/transaction-table";
import TransactionFormModal from "@/components/view/transaction/transaction-form-modal";
import TransactionViewModal from "@/components/view/transaction/transaction-view-modal";
import TransactionExcelUpload from "@/components/view/transaction/transaction-excel-upload";
import { Button } from "@/components/ui/button";
import DipositeSlip from "@/components/view/transaction/DepositeSlip";

export default function TransactionPage() {
	const [viewOpen, setViewOpen] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [excelOpen, setExcelOpen] = useState(false);
	const [editRow, setEditRow] = useState<Transaction>();
	const [viewId, setViewId] = useState<number>();
	const [refreshKey, setRefreshKey] = useState(0);
	const [printRow, setPrintRow] = useState<Transaction>();

	const bumpRefresh = () => {
		setRefreshKey((prev) => prev + 1);
	};

	const openView = (row: Transaction) => {
		setViewId(row.transactionId);
		setViewOpen(true);
	};

	const openForm = (row?: Transaction) => {
		setEditRow(row);
		setFormOpen(true);
	};

	const handleSaved = () => {
		bumpRefresh();
	};

	return (
		<div>
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-3xl font-bold text-foreground">
						Transactions
					</h1>
					<p className="text-gray-500 mt-2">Manage and monitor all financial entries</p>
				</div>
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						size="lg"
						onClick={() => setExcelOpen(true)}
						className="flex items-center gap-2 px-4 py-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
					>
						<Upload className="w-5 h-5" />
						Upload Excel
					</Button>
					<Button onClick={() => setFormOpen(true)}>
						<Plus className="w-4 h-4 mr-2" /> New Transaction
					</Button>
				</div>
			</div>

			<div className="rounded-lg">
				<TransactionTable
					onView={openView}
					onEdit={openForm}
					onPrint={setPrintRow}
					refreshKey={refreshKey}
				/>
			</div>

			<TransactionFormModal
				isOpen={formOpen}
				initialData={editRow}
				onClose={() => {
					setFormOpen(false);
					setEditRow(undefined);
				}}
				onSave={handleSaved}
			/>

			<TransactionViewModal
				isOpen={viewOpen}
				transactionId={viewId}
				onClose={() => {
					setViewOpen(false);
					setViewId(undefined);
				}}
			/>

			<TransactionExcelUpload
				isOpen={excelOpen}
				onClose={() => setExcelOpen(false)}
				onSuccess={handleSaved}
			/>
			<DipositeSlip printRow={printRow} />
		</div>
	);
}