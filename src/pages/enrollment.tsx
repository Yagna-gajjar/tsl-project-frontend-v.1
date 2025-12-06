import { useState } from "react";
import type { Enrollment } from "@/types/enrollment";
import EnrollmentTable from "@/components/view/enrollment/enrollment-table";
import EnrollmentViewModal from "@/components/view/enrollment/enrollment-view-modal";

export default function EnrollmentPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);

  const openView = (row: Enrollment) => {
    setViewData(row.enrollmentId);
    setViewOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Enrollment Management
          </h1>
          <p className="text-gray-500 mt-2">
            Manage student enrollments and registrations
          </p>
        </div>
      </div>

      <div className="rounded-lg">
        <EnrollmentTable onView={openView} refreshKey={refreshKey} />
      </div>

      <EnrollmentViewModal
        isOpen={viewOpen}
        enrollmentId={viewData}
        onClose={() => {
          setViewOpen(false);
          setViewData(undefined);
        }}
      />
    </div>
  );
}
