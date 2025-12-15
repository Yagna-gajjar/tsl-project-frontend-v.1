import { useState } from "react";
import CourseShareTable from "@/components/view/courseShare/course-share-table";
import CourseShareFormModal from "@/components/view/courseShare/course-share-form-modal";
import CourseShareViewModal from "@/components/view/courseShare/course-share-view-modal";
import type { CourseShare } from "@/types/courseShare";
import { Button } from "@/components/ui/button";

export default function CourseSharePage() {
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editRow, setEditRow] = useState<CourseShare | null>(null);
  const [viewId, setViewId] = useState<number | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => {
            setEditRow(null);
            setFormOpen(true);
          }}
        >
          Add Course Share
        </Button>
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
    </>
  );
}
