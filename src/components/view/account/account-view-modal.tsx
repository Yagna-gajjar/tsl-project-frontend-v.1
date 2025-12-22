import { useCallback, useEffect, useState } from "react";
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
  X,
} from "lucide-react";
import MemberFormModal from "../members/member-form-modal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";
import type { Response } from "@/types/response";
import { getAccountMembers } from "@/api/accountMember.api";
import type { AccountMember } from "@/types/accountMember";
import { changeAuthority, getAuthorities } from "@/api/authority.api";
import { toast } from "@/hooks/use-toast";
import type { Authority } from "@/types/authority";

type PropsMemberList = {
  open: boolean;
  onClose: () => void;
  members: AccountMember[];
  accountId?: number;
};

export function MemberListModal({
  open,
  onClose,
  members,
  accountId,
}: PropsMemberList) {
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  const [pendingMemberId, setPendingMemberId] = useState<number | null>(null);
  const [linkDate, setLinkDate] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const fetchAuthority = useCallback(async () => {
    if (!accountId) return;

    try {
      const res: Response<Authority[]> = await getAuthorities({
        accountId,
        active: true,
      });

      if (res?.success) {
        setCurrentMemberId(res?.data ? res?.data[0].memberId : null);
      }
    } catch (err) {
      console.error("Failed to fetch authority", err);
    }
  }, [accountId]);

  useEffect(() => {
    if (open) {
      fetchAuthority();
      setPendingMemberId(null);
      setLinkDate("");
    }
  }, [open, fetchAuthority]);

  const handleSave = async () => {
    if (!accountId || !currentMemberId || !pendingMemberId || !linkDate) {
      toast({
        title: "Missing data",
        description: "Please select member and date",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        oldMemberId: currentMemberId,
        newMemberId: pendingMemberId,
        accountId,
        linkDate,
      };

      const res: Response<Authority[]> = await changeAuthority(payload);

      if (res?.success) {
        setCurrentMemberId(pendingMemberId);
        setPendingMemberId(null);
        setLinkDate("");

        toast({
          title: "Success",
          description: "Authority updated successfully",
          variant: "success",
        });
      } else {
        throw new Error("Failed");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to change authority",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPendingMemberId(null);
    setLinkDate("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AnimatePresence>
        {open && (
          <DialogContent
            forceMount
            className="p-0 border-none bg-transparent shadow-none"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Select Family Member
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 p-1 rounded-full hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {pendingMemberId !== null &&
                pendingMemberId !== currentMemberId && (
                  <div className="pb-4 border-b border-gray-200 mb-4">
                    <label
                      htmlFor="link-date"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Effective Date:
                    </label>
                    <input
                      id="link-date"
                      type="date"
                      value={linkDate}
                      onChange={(e) => setLinkDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-blue-600 focus:border-blue-600 transition"
                    />
                  </div>
                )}

              <div className="space-y-4 overflow-y-auto pr-1 -mr-1">
                {members?.map((m) => {
                  const checked =
                    pendingMemberId !== null
                      ? pendingMemberId === m.memberId
                      : currentMemberId === m.memberId;

                  return (
                    <label
                      key={m.memberId}
                      className={`
                    border rounded-xl p-4 flex justify-between items-center cursor-pointer transition duration-150 ease-in-out
                    ${
                      checked
                        ? "border-blue-600 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-blue-300"
                    }
                  `}
                    >
                      <div>
                        <p className="font-semibold text-gray-800">
                          {m.memberFirstName} {m.memberLastName}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {m.relationship}
                        </p>
                      </div>

                      <input
                        type="radio"
                        name="authorityMember"
                        checked={checked}
                        disabled={loading}
                        onChange={() => setPendingMemberId(m.memberId)}
                        className="h-5 w-5 accent-blue-600 disabled:opacity-50"
                      />
                    </label>
                  );
                })}
              </div>

              {pendingMemberId !== null &&
                pendingMemberId !== currentMemberId && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={handleCancel}
                        className="px-5 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading || !linkDate}
                        className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:bg-blue-400"
                      >
                        {loading ? "Saving..." : "Confirm Selection"}
                      </button>
                    </div>
                  </div>
                )}
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

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
  const [memberListOpen, setMemberListOpen] = useState(false);
  const [memberList, setMemberList] = useState<AccountMember[]>([]);
  const [memberInitialData, setMemberInitialData] =
    useState<Partial<AccountMember> | null>(null);

  const openAddMemberForAccount = (account: Account | null) => {
    if (!account) return;
    setMemberInitialData({ accountId: account.accountId });
    setMemberFormOpen(true);
  };

  const fetchMembers = useCallback(async () => {
    if (!accountId) return;

    try {
      const res: Response<AccountMember[]> = await getAccountMembers({
        accountId: accountId,
      });

      setMemberList(res?.data ?? []);
    } catch {
      toast({
        title: "Failed",
        description: "failed to fetch member",
        variant: "destructive",
      });
      setMemberList([]);
    }
  }, [accountId]);

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
      };
    }

    if (f.key === "viewMember") {
      return {
        ...f,
        button: {
          ...f.button,
          onClick: async () => {
            await fetchMembers();
            setMemberListOpen(true);
          },
        },
      };
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
        initialData={memberInitialData}
        onClose={() => {
          setMemberFormOpen(false);
          setMemberInitialData(null);
        }}
        onSaved={async () => {
          setMemberFormOpen(false);
          await fetchMembers();
        }}
      />

      <MemberListModal
        open={memberListOpen}
        onClose={() => setMemberListOpen(false)}
        members={memberList}
        accountId={accountId}
      />
    </>
  );
}
