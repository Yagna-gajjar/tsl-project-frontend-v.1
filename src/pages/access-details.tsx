import { useState } from "react";
import { UserPlus, Shield } from "lucide-react";
import type { User } from "@/types/user";
import UserTable from "@/components/view/user/user-table";
import UserFormModal from "@/components/view/user/user-form-modal";
import UserViewModal from "@/components/view/user/user-view-modal";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function AccessAndDetails() {
	const [viewOpen, setViewOpen] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [editRow, setEditRow] = useState<User>();
	const [viewData, setViewData] = useState<number>();
	const [refreshKey, setRefreshKey] = useState(0);
	const router = useNavigate();

	// Function to trigger a re-fetch in the UserTable
	const bumpRefresh = () => {
		setRefreshKey((prev) => prev + 1);
	};

	const openView = (row: User) => {
		setViewData(row.userId);
		setViewOpen(true);
	};

	const openForm = (row?: User) => {
		setEditRow(row);
		setFormOpen(true);
	};

	const handleSaved = () => {
		bumpRefresh();
	};

	return (
		<div className="space-y-6">
			{/* Header Section */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
						<Shield className="w-8 h-8 text-primary" />
						User Management
					</h1>
					<p className="text-muted-foreground mt-2">
						Manage system access, roles, and member associations
					</p>
				</div>

				<div className="flex items-center gap-3">
					<Button
						onClick={() => {
							router("/staff-management/user-access");
						}}
						className="flex items-center gap-2"
					>
						<UserPlus className="w-4 h-4" />
						See Access
					</Button>
					<Button
						onClick={() => openForm()}
						className="flex items-center gap-2"
					>
						<UserPlus className="w-4 h-4" />
						Create User
					</Button>
				</div>
			</div>

			{/* Table Section */}
			<div className="bg-card rounded-xl border border-border shadow-sm">
				<UserTable
					onView={openView}
					onEdit={openForm}
					refreshKey={refreshKey}
				/>
			</div>

			{/* Modals */}
			<UserFormModal
				isOpen={formOpen}
				initialData={editRow}
				onClose={() => {
					setFormOpen(false);
					setEditRow(undefined);
				}}
				onSave={handleSaved}
			/>

			<UserViewModal
				isOpen={viewOpen}
				userId={viewData}
				onClose={() => {
					setViewOpen(false);
					setViewData(undefined);
				}}
			/>
		</div>
	);
}