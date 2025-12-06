import { useState } from "react";
import { View } from "lucide-react";
import type { Payment } from "@/types/payment";
import PaymentTable from "@/components/view/payment/payment-table";
import PaymentViewModal from "@/components/view/payment/payment-view-modal";

export default function PaymentPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const openView = (row: Payment) => {
    setViewData(row.paymentId);
    setViewOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments</h1>
          <p className="text-gray-500 mt-2">
            List of payments — view or delete records.
          </p>
        </div>
        {/* No Add button since form is removed */}
      </div>

      <div className=" rounded-lg">
        <PaymentTable onView={openView} refreshKey={refreshKey} />
      </div>

      <PaymentViewModal
        isOpen={viewOpen}
        paymentId={viewData}
        onClose={() => {
          setViewOpen(false);
          setViewData(undefined);
        }}
      />
    </div>
  );
}
