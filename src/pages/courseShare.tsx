import { useState } from "react";
import CourseShareTable from "@/components/view/courseShare/course-share-table";
import CourseShareFormModal from "@/components/view/courseShare/course-share-form-modal";
import CourseShareViewModal from "@/components/view/courseShare/course-share-view-modal";
import type { CourseShare } from "@/types/courseShare";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import CourseShareExcelUpload from "@/components/view/courseShare/course-share-excel-upload";

export default function CourseSharePage() {
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editRow, setEditRow] = useState<CourseShare | null>(null);
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
          <h1 className="text-3xl font-bold text-foreground">Course Share</h1>
          <p className="text-gray-500 mt-2">Manage Course Share</p>
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
            onClick={() => {
              setEditRow(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2"
            size={"lg"}
          >
            <Plus className="w-5 h-5" />
            Add Course Share
          </Button>
        </div>
      </div>

      <CourseShareTable
        refreshKey={refreshKey}
        onEdit={(row) => {
          setEditRow(row);
          setFormOpen(true);
        }}
        onView={(row) => {
          setViewId(row.courseShareId);
          setViewOpen(true);
        }}
      />

      <CourseShareFormModal
        isOpen={formOpen}
        initialData={editRow ?? undefined}
        onClose={() => setFormOpen(false)}
        onSave={() => setRefreshKey((k) => k + 1)}
      />

      <CourseShareViewModal
        isOpen={viewOpen}
        courseShareId={viewId}
        onClose={() => setViewOpen(false)}
      />

      <CourseShareExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={() => {
          handleSaved();
        }}
      />
    </>
  );
}
