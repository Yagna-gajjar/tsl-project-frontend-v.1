import { useState } from "react";
import { Plus } from "lucide-react";
import type { Course } from "@/types/course";
import CourseTable from "@/components/view/course/course-table";
import CourseFormModal from "@/components/view/course/course-form-modal";
import CourseViewModal from "@/components/view/course/course-view-modal";
import { Button } from "@/components/ui/button";

export default function CoursePage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Course>();
  const [viewData, setViewData] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);

  const bumpRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const openView = (row: Course) => {
    setViewData(row.courseId);
    setViewOpen(true);
  };

  const openForm = (row?: Course) => {
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
            Course Management
          </h1>
          <p className="text-gray-500 mt-2">Manage courses and programs</p>
        </div>

        <Button
          size="lg"
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-5 h-5" />
          Add Course
        </Button>
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
        initialData={editRow}
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
    </div>
  );
}
