import { useState } from "react";
import IncidentTable from "@/components/view/incident-report/incident-table";
import IncidentFormModal from "@/components/view/incident-report/incident-form-modal";
import IncidentViewModal from "@/components/view/incident-report/incident-view-modal";
import type { IncidentReport } from "@/types/incidentReport";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import IncidentExcelUpload from "@/components/view/incident-report/incident-excel-upload";

export default function IncidentReportingPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<IncidentReport | null>(null);
  const [excelOpen, setExcelOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<IncidentReport | null>(null);

  const [refreshKey, setRefreshKey] = useState<number>(0);
  const bumpRefresh = () => setRefreshKey((s) => s + 1);

  const openView = (row: IncidentReport) => {
    setViewData(row);
    setViewOpen(true);
  };

  const openForm = (row?: IncidentReport | null) => {
    setEditRow(row ?? null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditRow(null);
  };

  return (
    <div className="container mx-auto px-4 space-y-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Incident Reporting</h1>
          <p className="text-muted-foreground">
            Manage all incident reports in your system using a dynamic table.
          </p>
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

          <Button onClick={() => openForm(null)}>
            <Plus className="w-4 h-4 mr-2" /> Add Incident Report
          </Button>
        </div>
      </div>

      <IncidentTable onView={openView} onEdit={openForm} refreshKey={refreshKey} />

      <IncidentViewModal
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewData(null);
        }}
        item={viewData}
        incidentId={viewData?.incidentId}
      />

      <IncidentFormModal
        isOpen={formOpen}
        onClose={closeForm}
        initialData={editRow}
        onSaved={bumpRefresh}
      />

      <IncidentExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={bumpRefresh}
      />
    </div>
  );
}