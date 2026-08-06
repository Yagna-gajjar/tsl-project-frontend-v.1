import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormHeader } from "@/components/form-modal/form-header";
import { FormFooter } from "@/components/form-modal/form-footer";
import { FormContent } from "@/components/form-modal/form-content";
import { format } from "date-fns";

import {
  createIncidentReport,
  updateIncidentReport,
} from "@/api/incidentReport.api";
import type { IncidentReport } from "@/types/incidentReport";
import { toast } from "@/hooks/use-toast";
import type { Response } from "@/types/response";
import type { FormFieldConfig } from "@/components/form-modal/types";

import { getMembers } from "@/api/member.api";
import { getEntities } from "@/api/entity.api";
import { getBatch } from "@/api/batch.api";
import { getUsers } from "@/api/user.api";
import { getEnumsByCategory } from "@/api/enums.api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<IncidentReport> | null;
  onSaved?: (row?: IncidentReport) => void;
  layout?: "grid" | "list";
};

const emptyPayload: Partial<IncidentReport> = {
  incidentType: "",
  incidentReportedByMemberId: undefined,
  incidentReportedByName: "",
  incidentAgainstMemberId: undefined,
  incidentAgainstName: "",
  academyId: undefined,
  batchId: undefined,
  handledByUserId: undefined,
  status: "ACTIVE",
  reportedDate: "",
  resolvedDate: "",
  incidentDescription: "",
  reporterStatement: "",
  accusedStatement: "",
  tslVerdict: "",
  proofFile: "",
  remarks: "",
};

export function IncidentFormModal({
  isOpen,
  onClose,
  initialData = null,
  onSaved,
  layout = "grid",
}: Props) {
  const isEdit = Boolean(initialData && initialData.incidentId);

  const [values, setValues] = useState<Partial<IncidentReport>>(emptyPayload);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [memberOptions, setMemberOptions] = useState<{ label: string; value: number }[]>([]);
  const [academyOptions, setAcademyOptions] = useState<{ label: string; value: number }[]>([]);
  const [batchOptions, setBatchOptions] = useState<{ label: string; value: number }[]>([]);
  const [userOptions, setUserOptions] = useState<{ label: string; value: number }[]>([]);
  const [incidentTypeOptions, setIncidentTypeOptions] = useState<{ label: string; value: string }[]>([]);
  const [statusOptions, setStatusOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const loadOptions = async () => {
      try {
        setError(null);
        const [
          resMembers,
          resEntities,
          resBatches,
          resUsers,
          resTypes1,
          resTypes2,
          resStatus1,
          resStatus2,
        ] = await Promise.all([
          getMembers({ limit: 1000 }).catch(() => ({ data: [] })),
          getEntities({ limit: 1000 }).catch(() => ({ data: [] })),
          getBatch({ limit: 1000 }).catch(() => ({ data: [] })),
          getUsers({ limit: 1000 }).catch(() => ({ data: [] })),
          getEnumsByCategory("INCIDENT_TYPE").catch(() => ({ data: [] })),
          getEnumsByCategory("INCIDENTTYPE").catch(() => ({ data: [] })),
          getEnumsByCategory("INCIDENT_STATUS").catch(() => ({ data: [] })),
          getEnumsByCategory("INCIDENTSTATUS").catch(() => ({ data: [] })),
        ]);

        // Member options from Member table
        const members = Array.isArray(resMembers?.data) ? resMembers.data : [];
        setMemberOptions(
          members.map((m: any) => ({
            value: Number(m.memberId),
            label: `${m.memberFirstName || ""} ${m.memberLastName || ""}`.trim() || `Member #${m.memberId}`,
          }))
        );

        // Academy options from Entity table
        const entities = Array.isArray(resEntities?.data) ? resEntities.data : [];
        setAcademyOptions(
          entities.map((e: any) => ({
            value: Number(e.entityId),
            label: e.entityName || `Academy #${e.entityId}`,
          }))
        );

        // Batch options from Batch table (using getBatch API)
        const batches = Array.isArray(resBatches?.data) ? resBatches.data : [];
        setBatchOptions(
          batches.map((b: any) => ({
            value: Number(b.batchId),
            label: b.batchName || `Batch #${b.batchId}`,
          }))
        );

        // User options from User table
        const users = Array.isArray(resUsers?.data) ? resUsers.data : [];
        setUserOptions(
          users.map((u: any) => ({
            value: Number(u.userId),
            label: u.username || u.email || `User #${u.userId}`,
          }))
        );

        // Enum options for Incident Type
        const enumTypesRaw = [
          ...(Array.isArray(resTypes1?.data) ? resTypes1.data : []),
          ...(Array.isArray(resTypes2?.data) ? resTypes2.data : []),
        ];
        if (enumTypesRaw.length > 0) {
          const typeOpts = enumTypesRaw.map((e: any) => ({
            label: String(e.value),
            value: String(e.value),
          }));
          // Remove duplicates
          const uniqueTypes = Array.from(
            new Map(typeOpts.map((item) => [item.value, item])).values()
          );
          setIncidentTypeOptions(uniqueTypes);
        } else {
          // Fallback default enum options if EnumMaster table has no incident entries yet
          setIncidentTypeOptions([
            { label: "Misbehavior", value: "Misbehavior" },
            { label: "Property Damage", value: "Property Damage" },
            { label: "Discipline Violation", value: "Discipline Violation" },
            { label: "Safety Hazard", value: "Safety Hazard" },
            { label: "Theft / Loss", value: "Theft / Loss" },
            { label: "Other", value: "Other" },
          ]);
        }

        // Enum options for Incident Status
        const enumStatusRaw = [
          ...(Array.isArray(resStatus1?.data) ? resStatus1.data : []),
          ...(Array.isArray(resStatus2?.data) ? resStatus2.data : []),
        ];
        if (enumStatusRaw.length > 0) {
          const statusOpts = enumStatusRaw.map((e: any) => ({
            label: String(e.value),
            value: String(e.value),
          }));
          const uniqueStatus = Array.from(
            new Map(statusOpts.map((item) => [item.value, item])).values()
          );
          setStatusOptions(uniqueStatus);
        } else {
          // Fallback default enum options
          setStatusOptions([
            { label: "Active", value: "ACTIVE" },
            { label: "In Investigation", value: "IN_INVESTIGATION" },
            { label: "Resolved", value: "RESOLVED" },
            { label: "Dismissed", value: "DISMISSED" },
          ]);
        }

        // Initialize values
        if (initialData) {
          setValues({
            ...emptyPayload,
            ...initialData,
            reportedDate: initialData.reportedDate
              ? typeof initialData.reportedDate === "string"
                ? initialData.reportedDate.split("T")[0]
                : format(new Date(initialData.reportedDate), "yyyy-MM-dd")
              : "",
            resolvedDate: initialData.resolvedDate
              ? typeof initialData.resolvedDate === "string"
                ? initialData.resolvedDate.split("T")[0]
                : format(new Date(initialData.resolvedDate), "yyyy-MM-dd")
              : "",
          });
        } else {
          setValues({
            ...emptyPayload,
            reportedDate: format(new Date(), "yyyy-MM-dd"),
          });
        }
        setFieldErrors({});
      } catch (err) {
        console.error("Failed to load options for Incident Form:", err);
      }
    };

    loadOptions();
  }, [initialData, isOpen]);

  const onChange = (field: keyof IncidentReport, val: any) => {
    setValues((p) => ({ ...p, [field]: val }));
    setFieldErrors((prev) => {
      if (!prev[field as string]) return prev;
      const copy = { ...prev };
      delete copy[field as string];
      return copy;
    });
  };

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!values.incidentType || String(values.incidentType).trim() === "") {
      errs.incidentType = "Incident type is required";
    }
    return errs;
  }, [values]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setIsSubmitting(false);
      return;
    }

    try {
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
        incidentType: String(values.incidentType ?? "").trim(),
        incidentReportedByMemberId: values.incidentReportedByMemberId
          ? Number(values.incidentReportedByMemberId)
          : undefined,
        incidentReportedByName: values.incidentReportedByName
          ? String(values.incidentReportedByName).trim()
          : undefined,
        incidentAgainstMemberId: values.incidentAgainstMemberId
          ? Number(values.incidentAgainstMemberId)
          : undefined,
        incidentAgainstName: values.incidentAgainstName
          ? String(values.incidentAgainstName).trim()
          : undefined,
        academyId: values.academyId ? Number(values.academyId) : undefined,
        batchId: values.batchId ? Number(values.batchId) : undefined,
        handledByUserId: values.handledByUserId
          ? Number(values.handledByUserId)
          : undefined,
        status: values.status || "ACTIVE",
        reportedDate: values.reportedDate || undefined,
        resolvedDate: values.resolvedDate || undefined,
        incidentDescription: values.incidentDescription
          ? String(values.incidentDescription).trim()
          : undefined,
        reporterStatement: values.reporterStatement
          ? String(values.reporterStatement).trim()
          : undefined,
        accusedStatement: values.accusedStatement
          ? String(values.accusedStatement).trim()
          : undefined,
        tslVerdict: values.tslVerdict
          ? String(values.tslVerdict).trim()
          : undefined,
        proofFile: values.proofFile ? String(values.proofFile).trim() : undefined,
        remarks: values.remarks ? String(values.remarks).trim() : undefined,
      };

      let res: Response<IncidentReport>;
      if (isEdit && initialData?.incidentId) {
        res = await updateIncidentReport(Number(initialData.incidentId), payload);
      } else {
        res = await createIncidentReport(payload);
      }

      const ok =
        typeof res?.success !== "undefined"
          ? res.success === true || String(res.success) === "true"
          : true;

      if (!ok) {
        const msg = res?.message || "Failed to save incident report";
        setError(msg);
        toast({
          title: "Save failed",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Incident report ${isEdit ? "updated" : "created"} successfully.`,
      });
      onSaved?.(res.data || undefined);
      onClose();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save incident report";
      setError(errorMsg);
      toast({
        variant: "destructive",
        description: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, isEdit, initialData, onSaved, onClose, validate]);

  const fields = useMemo<FormFieldConfig<IncidentReport>[]>(
    () => [
      {
        name: "incidentType",
        label: "Incident Type",
        type: "select",
        required: true,
        options: incidentTypeOptions,
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: statusOptions,
      },
      {
        name: "incidentReportedByMemberId",
        label: "Reported By Member",
        type: "select",
        options: memberOptions,
      },
      {
        name: "incidentReportedByName",
        label: "Reported By (Manual Name if Non-Member)",
        type: "text",
      },
      {
        name: "incidentAgainstMemberId",
        label: "Accused Member",
        type: "select",
        options: memberOptions,
      },
      {
        name: "incidentAgainstName",
        label: "Accused (Manual Name if Non-Member)",
        type: "text",
      },
      {
        name: "academyId",
        label: "Academy",
        type: "select",
        options: academyOptions,
      },
      {
        name: "batchId",
        label: "Batch",
        type: "select",
        options: batchOptions,
      },
      {
        name: "handledByUserId",
        label: "Handled By User",
        type: "select",
        options: userOptions,
      },
      {
        name: "reportedDate",
        label: "Reported Date",
        type: "Date",
        required: true,
      },
      {
        name: "resolvedDate",
        label: "Resolved Date",
        type: "Date",
      },
      {
        name: "proofFile",
        label: "Proof File URL / Link",
        type: "text",
      },
      {
        name: "incidentDescription",
        label: "Incident Description",
        type: "textarea",
      },
      {
        name: "reporterStatement",
        label: "Reporter Statement",
        type: "textarea",
      },
      {
        name: "accusedStatement",
        label: "Accused Statement",
        type: "textarea",
      },
      {
        name: "tslVerdict",
        label: "TSL Verdict / Action Taken",
        type: "textarea",
      },
      {
        name: "remarks",
        label: "Remarks",
        type: "textarea",
      },
    ],
    [incidentTypeOptions, statusOptions, memberOptions, academyOptions, batchOptions, userOptions]
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-3xl p-0 border-border/50 shadow-2xl bg-background/95 backdrop-blur-lg rounded-xl overflow-hidden">
        <div className="flex flex-col max-h-[90vh] overflow-hidden">
          <FormHeader
            title={isEdit ? "Edit Incident Report" : "Add Incident Report"}
            onClose={onClose}
          />
          <div className="flex-1 overflow-y-auto p-4">
            <FormContent
              fields={fields}
              values={values}
              errors={fieldErrors}
              loading={false}
              error={error}
              isSubmitting={isSubmitting}
              onChange={(field, val) => onChange(field as keyof IncidentReport, val)}
              layout={layout}
            />
          </div>
          <FormFooter
            onClose={onClose}
            onSubmit={handleSubmit}
            submitLabel={isEdit ? "Update Report" : "Create Report"}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default IncidentFormModal;
