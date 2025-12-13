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

  /* ---------------- Fetch Current Authority ---------------- */

  const fetchAuthority = useCallback(async () => {
    if (!accountId) return;

    try {
      const res: Response<any[]> = await getAuthorities({
        accountId,
        active: true,
      });

      if (res?.success && res.data?.length > 0) {
        setCurrentMemberId(res.data[0].memberId);
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

  /* ---------------- Save Authority ---------------- */

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

      console.log(payload);

      const res: Response<any> = await changeAuthority(payload);

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

  /* ---------------- Render ---------------- */

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
              className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Family Members</h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Members */}
              <div className="space-y-3 overflow-y-auto">
                {members?.map((m) => {
                  const checked =
                    pendingMemberId !== null
                      ? pendingMemberId === m.memberId
                      : currentMemberId === m.memberId;

                  return (
                    <label
                      key={m.memberId}
                      className="border rounded-lg p-3 flex justify-between items-center cursor-pointer"
                    >
                      <div>
                        <p className="font-medium">
                          {m.memberFirstName} {m.memberLastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {m.relationship}
                        </p>
                      </div>

                      <input
                        type="radio"
                        name="authorityMember"
                        checked={checked}
                        disabled={loading}
                        onChange={() => setPendingMemberId(m.memberId)}
                        className="h-4 w-4 accent-black"
                      />
                    </label>
                  );
                })}
              </div>

              {/* Date + Actions */}
              {pendingMemberId !== null &&
                pendingMemberId !== currentMemberId && (
                  <div className="mt-4 space-y-3">
                    <input
                      type="date"
                      value={linkDate}
                      onChange={(e) => setLinkDate(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm border rounded-md"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading || !linkDate}
                        className="px-4 py-2 text-sm bg-black text-white rounded-md"
                      >
                        Save
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


/* ------------------------------------------------------------------ */
/* ------------------------ ACCOUNT VIEW MODAL ----------------------- */
/* ------------------------------------------------------------------ */

type Props = {
  isOpen: boolean;
  accountId?: number;
  onClose: () => void;
};

const baseViewFields: FieldConfig<Account>[] = [
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
  /* ---------------- Fetch Account ---------------- */

  const fetchFn = useCallback(async (id?: number) => {
    if (!id) throw new Error("Missing account ID");
    const res = await getAccountById(id);
    return res.data as Account;
  }, []);

  /* ---------------- State ---------------- */

  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [memberListOpen, setMemberListOpen] = useState(false);
  const [memberList, setMemberList] = useState<AccountMember[]>([]);
  const [memberInitialData, setMemberInitialData] =
    useState<Partial<AccountMember> | null>(null);

  /* ---------------- Helpers ---------------- */

  const openAddMemberForAccount = (account: Account | null) => {
    if (!account) return;
    setMemberInitialData({ accountId: account.accountId });
    setMemberFormOpen(true);
  };

  const fetchMembers = useCallback(async () => {
    if (!accountId) return;

    try {
      const res: Response<AccountMember[]> = await getAccountMembers({
        accountId,
      });
      setMemberList(res?.data ?? []);
    } catch (err) {
      console.error("Failed to fetch members", err);
      setMemberList([]);
    }
  }, [accountId]);

  /* ---------------- View Fields ---------------- */

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

  /* ---------------- Render ---------------- */

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
          await fetchMembers(); // refresh list after add
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
