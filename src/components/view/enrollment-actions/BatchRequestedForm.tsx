import { useCallback } from "react";
import { FormModal } from "@/components/form-modal/form-modal";
import type { FormFieldConfig } from "@/components/form-modal/types";
import type { Enrollment } from "@/types/enrollment";
import { toast } from "@/hooks/use-toast";
import { createBatchMemberRequests } from "@/api/enrollmentActions.api";

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

  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);
  const initialData: Partial<RequestPayload> = {
    status: "requested",
    memberName: enrollment?.memberName
      ? enrollment?.memberName
      : `${enrollment?.memberFirstName} ${enrollment?.memberLastName}`,
    memberId: enrollment?.memberId,
    enrollmentId: enrollment?.enrollmentId,
    batchId: batchId ?? "",
    reason: "",
    startDate: tomorrow.toISOString().split("T")[0],
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

      try {
        const res: Response = await createBatchMemberRequests(body);

        if (!res.success) {
          throw new Error("Request failed");
        }
        // At this point, we can consider success.
        toast({
          title: "Requested",
          description: "Batch request submitted.",
          variant: "success",
        });
        if (onSuccess) onSuccess();
        onClose();
      } catch (err) {
        toast({
          title: "Erro",
          description: "Request failed",
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
