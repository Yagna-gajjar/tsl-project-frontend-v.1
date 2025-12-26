import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import type { Course } from "@/types/course";
import CourseTable from "@/components/view/course/course-table";
import CourseFormModal from "@/components/view/course/course-form-modal";
import CourseViewModal from "@/components/view/course/course-view-modal";
import { Button } from "@/components/ui/button";
import CourseExcelUpload from "@/components/view/course/course-excel-upload";

export default function CoursePage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Course>();
  const [viewData, setViewData] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [excelOpen, setExcelOpen] = useState(false);

  const bumpRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };


  const openView = (row: Course) => {
    setViewData(row.courseId);
    setViewOpen(true);
  };

  const openForm = (row?: Course) => {
    if (row) {
      setEditRow({
        course: row,
        packages: [],
        rates: [],
        shares: [],
      } as any);
    } else {
      setEditRow(undefined);
    }
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
            Course Management
          </h1>
          <p className="text-gray-500 mt-2">Manage courses and programs</p>
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
            size="lg"
            onClick={() => openForm()}
            className="flex items-center gap-2 px-4 py-2"
          >
            <Plus className="w-5 h-5" />
            Add Course
          </Button>
        </div>
      </div>

      <div className="rounded-lg">
        <CourseTable
          onView={openView}
          onEdit={openForm}
          refreshKey={refreshKey}
        />
      </div>

      <CourseFormModal
        isOpen={formOpen}
        initialData={editRow as any}
        onClose={() => {
          setFormOpen(false);
          setEditRow(undefined);
        }}
        onSave={handleSaved}
      />

      <CourseViewModal
        isOpen={viewOpen}
        courseId={viewData}
        onClose={() => {
          setViewOpen(false);
          setViewData(undefined);
        }}
      />

      <CourseExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={() => {
          handleSaved();
        }}
      />
    </div>
  );
}
