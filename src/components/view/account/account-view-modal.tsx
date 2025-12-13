import { useCallback, useState } from "react";
import { ViewModal } from "@/components/view-modal/view-modal";
import type { Account } from "@/types/account";
import { getAccountById } from "@/api/account.api";
import type { FieldConfig } from "@/components/view-modal/types";
import { formatDateForInput } from "@/lib/utils";
import {
  User,
  Calendar,
  Phone,
  Building2,
  FileText,
  Plus,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import MemberFormModal from "../members/member-form-modal";

type Props = {
  isOpen: boolean;
  accountId?: number;
  onClose: () => void;
};

const baseViewFields: FieldConfig<Account | any>[] = [
  {
    key: "addMember",
    label: "Expand Family",
    type: "button",
    icon: Plus,
    button: {
      label: "Add Member",
      variant: "default",
      size: "sm",
      span: 1,
      onClick: undefined,
    },
  },
  {
    key: "viewMember",
    label: "View All Members",
    type: "button",
    icon: Users,
    button: {
      label: "View Member",
      variant: "default",
      size: "sm",
      span: 1,
      onClick: undefined,
    },
  },
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

  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [memberInitialData, setMemberInitialData] =
    useState<Partial<any> | null>(null);

  const openAddMemberForAccount = (account: Account | undefined | null) => {
    if (!account) return;
    setMemberInitialData({
      accountId: account.accountId,
    });
    setMemberFormOpen(true);
  };
  const navigate = useNavigate();

  const fields = baseViewFields.map((f) => {
    if (f.key === "addMember") {
      return {
        ...f,
        button: {
          ...f.button,
          onClick: (row: Account) => {
            openAddMemberForAccount(row ?? null);
          },
        },
      } as FieldConfig<Account>;
    } else if (f.key === "viewMember") {
      return {
        ...f,
        button: {
          ...f.button,
          onClick: (row: Account) => {
            const accountId = row?.accountId;
            if (!accountId) return;

            navigate(`/member?accountId=${accountId}`);
          },
        },
      } as FieldConfig<Account>;
    }

    return f;
  });

  return (
    <>
      <ViewModal<Account>
        isOpen={isOpen}
        onClose={onClose}
        itemId={accountId}
        fetchFn={fetchFn}
        fields={fields}
        title="View Account"
        layout="grid"
      />
      <MemberFormModal
        isOpen={memberFormOpen}
        onClose={() => {
          setMemberFormOpen(false);
          setMemberInitialData(null);
        }}
        initialData={memberInitialData}
        onSaved={() => {
          setMemberFormOpen(false);
        }}
      />
    </>
  );
}
