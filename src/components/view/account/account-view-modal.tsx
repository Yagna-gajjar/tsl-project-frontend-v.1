import { useCallback } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { Account } from "@/types/account";
import { getAccountById } from "@/api/account.api";
import type { FieldConfig } from "@/components/view-modal/types";
import { formatDateForInput } from "@/lib/utils";
import { User, Calendar, Phone, Building2, FileText } from "lucide-react";

type Props = {
  isOpen: boolean;
  accountId?: number;
  onClose: () => void;
};

const fields: FieldConfig<Account>[] = [
  { key: "accountId", label: "Account ID", icon: User },
  { key: "name", label: "Account Name", icon: User },
  { key: "defineEntity", label: "Define Entity", icon: Building2 },
  { key: "contact", label: "Contact", icon: Phone },
  { key: "proffesionalSector", label: "Sector", icon: FileText },
  { key: "adminInstruction", label: "Admin Instruction", icon: FileText },
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

export default function AccountViewModal({
  isOpen,
  accountId,
  onClose,
}: Props) {
  const fetchFn = useCallback(async (id?: number) => {
    if (!id) throw new Error("Missing account ID");
    const res = await getAccountById(id);
    return res.data as Account;
  }, []);

  return (
    <ViewModal<Account>
      isOpen={isOpen}
      onClose={onClose}
      itemId={accountId}
      fetchFn={fetchFn}
      fields={fields}
      title="View Account"
      layout="grid"
    />
  );
}
