import { useCallback, useMemo, useState } from "react";
import {
  ViewModal,
  type FieldConfig,
} from "@/components/view-modal/view-modal";
import type { membership } from "@/types/membership";
import { getMembershipById } from "@/api/membership.api";
import { Plus, Hash, Calendar, CreditCard, CheckCircle } from "lucide-react";
import MembershipLinkFormModal from "@/components/view/membershipLink/membership-link-form-modal";

type Props = {
  isOpen: boolean;
  membershipId?: number;
  onClose: () => void;
};

const toRs = (v?: number) => `Rs. ${Number(v ?? 0).toFixed(2)}`;
const dateRender = (v?: Date | string | null) =>
  v ? new Date(v as Date).toLocaleString() : "-";

/**
 * Base fields (NO LOGIC HERE)
 */
const baseViewFields: FieldConfig<membership | any>[] = [
  {
    key: "addAccount",
    label: "Add Account",
    type: "button",
    icon: Plus,
    button: {
      label: "Add Account",
      variant: "default",
      size: "sm",
      onClick: undefined,
    },
  },

  { key: "membershipId", label: "ID", icon: Hash },
  { key: "membershipMasterId", label: "Membership Master", icon: Hash },
  { key: "accountId", label: "Account", icon: Hash },

  { key: "startDate", label: "Start Date", icon: Calendar, render: dateRender },
  { key: "endDate", label: "End Date", icon: Calendar, render: dateRender },
  { key: "graceDate", label: "Grace Date", icon: Calendar, render: dateRender },

  {
    key: "totalIssueCharges",
    label: "Issue Charges",
    icon: CreditCard,
    render: toRs,
  },
  {
    key: "appDiscount",
    label: "App Discount",
    icon: CreditCard,
    render: toRs,
  },
  {
    key: "totalSpendComm",
    label: "Total Spent",
    icon: CreditCard,
    render: toRs,
  },
  {
    key: "status",
    label: "Status",
    icon: CheckCircle,
  },
  {
    key: "createdAt",
    label: "Created At",
    icon: Calendar,
    render: dateRender,
  },
  {
    key: "updatedAt",
    label: "Updated At",
    icon: Calendar,
    render: dateRender,
  },
];

export default function MembershipViewModal({
  isOpen,
  membershipId,
  onClose,
}: Props) {
  const [rowData, setRowData] = useState<membership | null>(null);
  const [addAccountOpen, setAddAccountOpen] = useState(false);

  /**
   * Fetch membership
   */
  const fetchFn = useCallback(
    async (id?: number | string): Promise<membership> => {
      const useId = id ?? membershipId;
      if (!useId) throw new Error("Membership ID missing");

      const res: any = await getMembershipById(Number(useId));
      const data = res?.data as membership;

      setRowData(data);
      return data;
    },
    [membershipId]
  );

  const fields = useMemo(() => {
    return baseViewFields
      .filter((f) => {
        if (f.key === "addAccount" && rowData?.accountId != null) {
          return false;
        }
        return true;
      })
      .map((f) => {
        if (f.key === "addAccount") {
          return {
            ...f,
            button: {
              ...f.button,
              onClick: () => setAddAccountOpen(true),
            },
          } as FieldConfig<membership>;
        }
        return f;
      });
  }, [rowData]);

  return (
    <>
      <ViewModal<membership>
        isOpen={isOpen}
        onClose={onClose}
        itemId={Number(membershipId)}
        fetchFn={fetchFn}
        fields={fields}
        title="Membership Details"
        layout="grid"
      />

      {rowData && (
        <MembershipLinkFormModal
          isOpen={addAccountOpen}
          membershipId={rowData.membershipId}
          membershipMasterId={rowData.membershipMasterId}
          onClose={() => setAddAccountOpen(false)}
          onSave={() => {
            setAddAccountOpen(false);
          }}
        />
      )}
    </>
  );
}
