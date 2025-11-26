"use client";

import { useCallback } from "react";
import type { Enums } from "@/types/enums";
import {
  ViewModal,
  type FieldConfig,
} from "@/components/view-modal/view-modal";
import { number } from "framer-motion";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item?: Enums | null;
  title?: string;
};

const viewFields: FieldConfig<Enums>[] = [
  { key: "id", label: "ID" },
  { key: "category", label: "Category" },
  { key: "value", label: "Value" },
];

export default function EnumsViewModal({
  isOpen,
  onClose,
  item,
  title = "View Enum",
}: Props) {
  const fetchFn = useCallback(
    async (id?: number | string) => {
      if (!item) throw new Error("No data");
      return item;
    },
    [item]
  );

  return (
    <ViewModal<Enums>
      isOpen={isOpen}
      onClose={onClose}
      itemId={Number(item?.id)}
      fetchFn={fetchFn}
      fields={viewFields as any}
      title={title}
      layout="list"
    />
  );
}
