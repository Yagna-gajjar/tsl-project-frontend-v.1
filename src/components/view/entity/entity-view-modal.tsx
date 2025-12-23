import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { Entity } from "@/types/entity";
import { getEntityById } from "@/api/entity.api";
import type { FieldConfig } from "@/components/view-modal/types";
import { formatDateForInput } from "@/lib/utils";
import { Building2, Calendar, Tag, FileText } from "lucide-react";

type Props = {
  isOpen: boolean;
  entityId?: number;
  onClose: () => void;
};

const fields: FieldConfig<Entity>[] = [
  { key: "entityId", label: "Entity ID", icon: Tag },
  { key: "entityName", label: "Entity Name", icon: Building2 },
  { key: "entityType", label: "Entity Type", icon: Tag },
  { key: "legalStatus", label: "Legal Status", icon: FileText },
  { key: "legalName", label: "Legal Name", icon: FileText },
  {
    key: "regDate",
    label: "Registration Date",
    icon: Calendar,
    render: (v) => (v ? formatDateForInput(v as string) : "-"),
  },
  {
    key: "suspensionDate",
    label: "Suspension Date",
    icon: Calendar,
    render: (v) => (v ? formatDateForInput(v as string) : "-"),
  },
];

export default function EntityViewModal({ isOpen, entityId, onClose }: Props) {
  const fetchFn = useCallback(async (id?: number) => {
    if (!id) throw new Error("Missing ID");
    const res = await getEntityById(id);
    return res.data as Entity;
  }, []);

  return (
    <ViewModal<Entity>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(entityId)}
      fetchFn={fetchFn as any}
      fields={fields}
      title="View Entity"
      layout="grid"
    />
  );
}
