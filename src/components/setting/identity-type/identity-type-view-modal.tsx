import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { IdentityType } from "@/types/identityType";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item?: IdentityType | null;
};

const fields = [
  { key: "identityTypeId", label: "ID" },
  { key: "identityTypeName", label: "Identity Name" },
  { key: "familyTypeId", label: "Family Type" },
  { key: "teamCategoryId", label: "Team Category" },
  { key: "discount", label: "Discount" },
  {
    key: "createdAt",
    label: "Created At",
    render: (v: any) => (v ? new Date(v).toLocaleString() : "-"),
  },
  {
    key: "updatedAt",
    label: "Updated At",
    render: (v: any) => (v ? new Date(v).toLocaleString() : "-"),
  },
];

export default function IdentityTypeViewModal({
  isOpen,
  onClose,
  item,
}: Props) {
  const fetchFn = useCallback(
    async (id?: number | string) => {
      if (!item) throw new Error("No data");
      return item;
    },
    [item]
  );

  return (
    <ViewModal<IdentityType>
      isOpen={isOpen}
      onClose={onClose}
      itemId={item?.identityTypeId}
      fetchFn={fetchFn}
      fields={fields as any}
      title="View Identity Type"
    />
  );
}
