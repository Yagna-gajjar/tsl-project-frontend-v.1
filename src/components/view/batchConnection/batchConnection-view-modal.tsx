import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { BatchConnection } from "@/types/batchConnection";
import { getBatchConnectionById } from "@/api/batchConnection.api";
import { Tag, Calendar, Layers } from "lucide-react";
import type { FieldConfig } from "@/components/view-modal/types";
import type { Response } from "@/types/response";

type Props = {
  isOpen: boolean;
  batchConnectionId?: number;
  onClose: () => void;
};

const fields: FieldConfig<BatchConnection>[] = [
  { key: "batchConnectionId", label: "ID", icon: Tag },
  { key: "mainBatchName", label: "Main Batch", icon: Layers },
  { key: "mainBatchId", label: "Main Batch ID", icon: Layers },
  { key: "preBatchName", label: "Pre Batch", icon: Layers },
  { key: "preBatch", label: "Pre Batch ID", icon: Layers },
  { key: "postBatchName", label: "Post Batch", icon: Layers },
  { key: "postBatch", label: "Post Batch ID", icon: Layers },
  { key: "startDate", label: "Start Date", icon: Calendar },
  { key: "endDate", label: "End Date", icon: Calendar },
  {
    key: "createdAt",
    label: "Created At",
    icon: Calendar,
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Calendar,
    render: (v) => (v ? new Date(v).toLocaleString() : "-"),
  },
];

export default function BatchConnectionViewModal({
  isOpen,
  batchConnectionId,
  onClose,
}: Props) {
  const fetchFn = useCallback(
    async (id?: number | string) => {
      const useId = id ?? batchConnectionId;
      if (!useId) throw new Error("ID missing");
      const res: Response = await getBatchConnectionById(Number(useId));
      if (res && res.data) return res.data as BatchConnection;
      return res;
    },
    [batchConnectionId]
  );

  return (
    <ViewModal<BatchConnection>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(batchConnectionId)}
      fetchFn={fetchFn as any}
      fields={fields}
      title="View Batch Connection"
      layout="grid"
    />
  );
}
