"use client";

import React, { useCallback } from "react";
import { FormModal } from "@/components/form-modal/form-modal";
import type { FormFieldConfig } from "@/components/form-modal/types";
import type { Enrollment } from "@/types/enrollment";
import { toast } from "@/hooks/use-toast";
import { error } from "console";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  batchId: number;
  enrollment: Enrollment;
  onSuccess?: () => void;
};

// Shape we will submit from the dynamic form
type RequestPayload = {
  status: string;
  memberId: number | string;
  batchId: number | string;
  enrollmentId: number | string;
  reason: string;
  startDate: string;
  endDate: string;
};

export default function BatchRequestedForm({
  isOpen,
  onClose,
  batchId,
  enrollment,
  onSuccess,
}: Props) {
  // Build dynamic fields that match the FormModal expectations
  const fields: FormFieldConfig<RequestPayload>[] = [
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { label: "Requested", value: "requested" },
        { label: "Pending", value: "pending" },
      ],
      placeholder: "Select status",
    },
    {
      name: "enrollmentId",
      label: "Enrollment ID",
      type: "text",
      required: true,
      disabled: true,
      placeholder: "Auto",
    },
    {
      name: "memberId",
      label: "Member ID",
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
    },
  ];

  const initialData: Partial<RequestPayload> = {
    status: "requested",
    enrollmentId: enrollment?.enrollmentId ?? enrollment?.id ?? "",
    memberId: enrollment?.memberId ?? "",
    batchId: batchId ?? "",
    reason: "",
    startDate: "",
    endDate: "",
  };

  // inside BatchRequestForm: improved handleSubmit
  const handleSubmit = useCallback(
    async (values: RequestPayload) => {
      const body = {
        status: values.status,
        memberId: Number(values.memberId),
        batchId: Number(batchId),
        enrollmentId: Number(values.enrollmentId),
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
      title={`Request spot in batch ${batchId}`}
      fields={fields}
      initialData={initialData}
      onSubmit={handleSubmit}
      submitLabel="Request Spot"
      layout="grid"
    />
  );
}
