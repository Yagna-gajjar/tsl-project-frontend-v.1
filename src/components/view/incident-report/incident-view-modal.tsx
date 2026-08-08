import { useCallback } from "react";
import {
  Hash,
  AlertTriangle,
  User,
  Building,
  Users,
  Info,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  Shield,
  File,
} from "lucide-react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { IncidentReport } from "@/types/incidentReport";
import { getIncidentReport } from "@/api/incidentReport.api";
import type { FieldConfig } from "@/components/view-modal/types";
import type { Response } from "@/types/response";

type Props = {
  isOpen: boolean;
  incidentId?: number;
  item?: IncidentReport | null;
  onClose: () => void;
};

const fields: FieldConfig<IncidentReport>[] = [
  { key: "incidentId", label: "Incident ID", icon: Hash },
  { key: "incidentType", label: "Incident Type", icon: AlertTriangle },
  {
    key: "reportedByMemberFirstName",
    label: "Reported By",
    icon: User,
    render: (_, r) => {
      if (r.reportedByMemberFirstName || r.reportedByMemberLastName) {
        return `${r.reportedByMemberFirstName ?? ""} ${r.reportedByMemberLastName ?? ""}`.trim();
      }
      return r.incidentReportedByName || "-";
    },
  },
  {
    key: "againstMemberFirstName",
    label: "Accused / Against",
    icon: User,
    render: (_, r) => {
      if (r.againstMemberFirstName || r.againstMemberLastName) {
        return `${r.againstMemberFirstName ?? ""} ${r.againstMemberLastName ?? ""}`.trim();
      }
      return r.incidentAgainstName || "-";
    },
  },
  { key: "academyName", label: "Academy", icon: Building },
  { key: "batchName", label: "Batch", icon: Users },
  {
    key: "status",
    label: "Status",
    icon: Info,
    render: (v) => (
      <span className="capitalize font-semibold text-primary">
        {String(v || "ACTIVE")}
      </span>
    ),
  },
  {
    key: "reportedDate",
    label: "Reported Date",
    icon: Calendar,
    render: (v) => (v ? new Date(v as string | Date).toLocaleDateString() : "-"),
  },
  {
    key: "resolvedDate",
    label: "Resolved Date",
    icon: Calendar,
    render: (v) => (v ? new Date(v as string | Date).toLocaleDateString() : "-"),
  },
  { key: "handledByUsername", label: "Handled By", icon: User },
  { key: "incidentDescription", label: "Description", icon: FileText },
  { key: "reporterStatement", label: "Reporter Statement", icon: MessageSquare },
  { key: "accusedStatement", label: "Accused Statement", icon: MessageSquare },
  { key: "tslVerdict", label: "TSL Verdict / Action", icon: Shield },
  { key: "proofFile", label: "Proof File Link", icon: File },
  { key: "remarks", label: "Remarks", icon: FileText },
  {
    key: "createdAt",
    label: "Created At",
    icon: Clock,
    render: (v) => (v ? new Date(v as string | Date).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Last Updated",
    icon: Clock,
    render: (v) => (v ? new Date(v as string | Date).toLocaleString() : "-"),
  },
];

export default function IncidentViewModal({
  isOpen,
  incidentId,
  item,
  onClose,
}: Props) {
  const fetchFn = useCallback(
    async (id?: number | string): Promise<IncidentReport> => {
      if (item && (item.incidentId === id || !id)) {
        return item;
      }
      const targetId = id ?? incidentId ?? item?.incidentId;
      if (!targetId) {
        throw new Error("Incident Report ID is missing");
      }

      const res: Response<IncidentReport> = await getIncidentReport(Number(targetId));
      if (res.success && res.data) {
        return res.data;
      }
      throw new Error(res.message || "Failed to load incident report details");
    },
    [incidentId, item]
  );

  const activeId = incidentId ?? item?.incidentId ?? 0;

  return (
    <ViewModal<IncidentReport>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(activeId)}
      fetchFn={fetchFn}
      fields={fields}
      title="Incident Report Details"
      layout="grid"
    />
  );
}
