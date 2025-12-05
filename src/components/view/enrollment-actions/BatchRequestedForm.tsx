import { useCallback } from "react";
import { FormModal } from "@/components/form-modal/form-modal";
import type { FormFieldConfig } from "@/components/form-modal/types";
import type { Enrollment } from "@/types/enrollment";
import { toast } from "@/hooks/use-toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  batchId: number;
  batchName: string;
  enrollment: Enrollment;
  onSuccess?: () => void;
};

// Shape we will submit from the dynamic form
type RequestPayload = {
  status: string;
  batchId: number | string;
  enrollmentId: number | null;
  memberName: string;
  memberId: number | null;
  reason: string;
  startDate: string;
  endDate: string;
};

export default function BatchRequestedForm({
  isOpen,
  onClose,
  batchId,
  batchName,
  enrollment,
  onSuccess,
}: Props) {
  // Build dynamic fields that match the FormModal expectations
  const fields: FormFieldConfig<RequestPayload>[] = [
    {
      name: "status",
      label: "Status",
      type: "text",
      required: true,
      placeholder: "Select status",
    },
    {
      name: "memberName",
      label: "member Name",
      type: "text",
      required: true,
      disabled: true,
      placeholder: "Auto",
    },
    {
      name: "reason",
      label: "Reason",
      type: "textarea",
      required: true,
      placeholder: "Why request a spot in this batch?",
    },
    {
      name: "startDate",
      label: "Start Date",
      type: "date",
      required: true,
      placeholder: "Select start date",
    },
    {
      name: "endDate",
      label: "End Date",
      type: "date",
      required: true,
      placeholder: "Select end date",
      disabled: true,
    },
  ];

  const initialData: Partial<RequestPayload> = {
    status: "requested",
    memberName: enrollment?.memberFirstName + " " + enrollment?.memberLastName,
    memberId: enrollment?.memberId,
    enrollmentId: enrollment?.enrollmentId,
    batchId: batchId ?? "",
    reason: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: enrollment?.endDate
      ? new Date(enrollment.endDate).toISOString().split("T")[0]
      : "",
  };

  // inside BatchRequestForm: improved handleSubmit
  const handleSubmit = useCallback(
    async (values: RequestPayload) => {
      const body = {
        status: values.status,
        batchId: Number(batchId),
        memberId: values.memberId,
        enrollmentId: values.enrollmentId,
        memberName: values.memberName,
        reason: values.reason,
        startDate: values.startDate,
        endDate: values.endDate,
      };
      console.log(body);

      try {
        const res: Response = await fetch(
          "http://localhost:9705/api/batch-member/request",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );

        // try to parse JSON safely
        let json: any = null;
        const text = await res.text();
        if (text) {
          try {
            json = JSON.parse(text);
          } catch (parseErr) {
            console.warn("Non-JSON response from server:", text);
            console.error(parseErr);

            // fallthrough - treat as error if not OK
          }
        }

        if (!res.ok) {
          const message =
            json?.message || `Request failed with status ${res.status}`;
          throw new Error(message);
        }

        // At this point, we can consider success.
        toast({ title: "Requested", description: "Batch request submitted." });
        if (onSuccess) onSuccess();
        onClose();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        toast({
          title: "Request failed",
          description: message,
          variant: "destructive",
        });
        // rethrow so FormModal surfaces error too (optional)
        throw err;
      }
    },
    [batchId, onClose, onSuccess]
  );

  return (
    <FormModal<RequestPayload>
      isOpen={isOpen}
      onClose={onClose}
      title={`Request spot in ${batchName}`}
      fields={fields}
      initialData={initialData}
      onSubmit={handleSubmit}
      submitLabel="Request Spot"
      layout="grid"
    />
  );
}
