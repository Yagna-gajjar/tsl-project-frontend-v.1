import { useState } from "react";
import CoursePackageTable from "@/components/view/coursePackage/course-package-table";
import CoursePackageFormModal from "@/components/view/coursePackage/course-package-form-modal";
import CoursePackageViewModal from "@/components/view/coursePackage/course-package-view-modal";
import type { CoursePackage } from "@/types/coursePackage";
import { Button } from "@/components/ui/button";

export default function CoursePackagePage() {
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editRow, setEditRow] = useState<CoursePackage | null>(null);
  const [viewId, setViewId] = useState<number | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Course Package</h1>
          <p className="text-gray-500 mt-2">Manage Course Package</p>
        </div>
        <Button
          onClick={() => {
            setEditRow(null);
            setFormOpen(true);
          }}
        >
          Add Course Package
        </Button>
      </div>

      <CoursePackageTable
        refreshKey={refreshKey}
        onEdit={(row) => {
          setEditRow(row);
          setFormOpen(true);
        }}
        onView={(row) => {
          setViewId(row.coursePackageId);
          setViewOpen(true);
        }}
      />

      <CoursePackageFormModal
        isOpen={formOpen}
        initialData={editRow ?? undefined}
        onClose={() => setFormOpen(false)}
        onSave={() => setRefreshKey((k) => k + 1)}
      />

      <CoursePackageViewModal
        isOpen={viewOpen}
        coursePackageId={viewId}
        onClose={() => setViewOpen(false)}
      />
    </>
  );
}
