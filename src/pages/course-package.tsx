import { useState } from "react";
import CoursePackageTable from "@/components/view/coursePackage/course-package-table";
import CoursePackageFormModal from "@/components/view/coursePackage/course-package-form-modal";
import CoursePackageViewModal from "@/components/view/coursePackage/course-package-view-modal";
import type { CoursePackage } from "@/types/coursePackage";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import CoursePackageExcelUpload from "@/components/view/coursePackage/course-package-excel-upload";

export default function CoursePackagePage() {
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editRow, setEditRow] = useState<CoursePackage | null>(null);
  const [viewId, setViewId] = useState<number | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [excelOpen, setExcelOpen] = useState(false);
  const bumpRefresh = () => setRefreshKey((s) => s + 1);

  const handleSaved = () => {
    bumpRefresh();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Course Package</h1>
          <p className="text-gray-500 mt-2">Manage Course Package</p>
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
          <Button
          size={"lg"}
            onClick={() => {
              setEditRow(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2"
          >
            <Plus className="w-5 h-5" />
            Add Course Package
          </Button>
        </div>
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

      <CoursePackageExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={() => {
          handleSaved();
        }}
      />
    </>
  );
}
