import { useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import ExcelUpload from "@/components/ExcelUploader";
import { createIncidentReport } from "@/api/incidentReport.api";
import type { IncidentReport } from "@/types/incidentReport";

interface IncidentExcelUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface IncidentImportRow {
  incidentType: string;
  incidentReportedByName?: string;
  incidentAgainstName?: string;
  status?: string;
  incidentDescription?: string;
  reporterStatement?: string;
  accusedStatement?: string;
  tslVerdict?: string;
  remarks?: string;
}

export default function IncidentExcelUpload({
  isOpen,
  onClose,
  onSuccess,
}: IncidentExcelUploadProps) {
  const expectedColumns = useMemo(
    () => [
      "incidentType",
      "incidentReportedByName",
      "incidentAgainstName",
      "status",
      "incidentDescription",
      "reporterStatement",
      "accusedStatement",
      "tslVerdict",
      "remarks",
    ],
    []
  );

  const handleValidateRow = useCallback((row: IncidentImportRow) => {
    if (!row.incidentType || String(row.incidentType).trim() === "") {
      return "Incident Type is required";
    }
    return null;
  }, []);

  const handleCreateIncident = useCallback(
    async (row: IncidentImportRow) => {
      const payload: Omit<
        IncidentReport,
        | "incidentId"
        | "createdAt"
        | "updatedAt"
        | "reportedByMemberFirstName"
        | "reportedByMemberLastName"
        | "againstMemberFirstName"
        | "againstMemberLastName"
        | "academyName"
        | "batchName"
        | "handledByUsername"
      > = {
        incidentType: String(row.incidentType).trim(),
        incidentReportedByName: row.incidentReportedByName || undefined,
        incidentAgainstName: row.incidentAgainstName || undefined,
        status: row.status ? String(row.status).toUpperCase() : "ACTIVE",
        incidentDescription: row.incidentDescription || undefined,
        reporterStatement: row.reporterStatement || undefined,
        accusedStatement: row.accusedStatement || undefined,
        tslVerdict: row.tslVerdict || undefined,
        remarks: row.remarks || undefined,
      };

      await createIncidentReport(payload);
    },
    []
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl h-[75vh] bg-white dark:bg-slate-950 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Bulk Import Incident Reports
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Upload an Excel spreadsheet containing incident details.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden p-6 bg-gray-50 dark:bg-slate-900/50">
              <ExcelUpload<IncidentImportRow>
                title="Incident Report Master Sheet"
                expectedColumns={expectedColumns}
                createFunction={handleCreateIncident}
                validateRow={handleValidateRow}
                onUploadComplete={() => {
                  onSuccess();
                  onClose();
                }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
