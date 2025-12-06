import { useState } from "react";
import { Plus } from "lucide-react";
import type { Discount } from "@/types/discount";
import DiscountTable from "@/components/view/discount/discount-table";
import DiscountFormModal from "@/components/view/discount/discount-form-modal";
import DiscountViewModal from "@/components/view/discount/discount-view-modal";
import { Button } from "@/components/ui/button";

export default function DiscountPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Discount>();
  const [viewData, setViewData] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const openView = (row: Discount) => {
    setViewData(row.discountId);
    setViewOpen(true);
  };

  const openForm = (row?: Discount) => {
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
            Discount Management
          </h1>
          <p className="text-gray-500 mt-2">Manage course discounts</p>
        </div>

        <Button
          size="lg"
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-5 h-5" />
          Add Discount
        </Button>
      </div>

      <div className="rounded-lg">
        <DiscountTable
          onView={openView}
          onEdit={openForm}
          refreshKey={refreshKey}
        />
      </div>

      <DiscountFormModal
        isOpen={formOpen}
        initialData={editRow}
        onClose={() => {
          setFormOpen(false);
          setEditRow(undefined);
        }}
        onSave={handleSaved}
      />

      <DiscountViewModal
        isOpen={viewOpen}
        discountId={viewData}
        onClose={() => {
          setViewOpen(false);
          setViewData(undefined);
        }}
      />
    </div>
  );
}
