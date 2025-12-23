import { useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import ExcelUpload from "@/components/ExcelUploader";
import { createMembershipMaster } from "@/api/membershipMaster.api";
import type { MembershipMaster } from "@/types/membershipMaster";

interface MembershipExcelUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MembershipImportRow {
  membershipType: string;
  introductionDate?: string | number;
  suspensionDate?: string | number;
  billingEntityOfFamily?: string;
  membershipDetails: string;

  durationDays: number | string;
  caDepositPR: number | string;
  minIssueCharge: number | string;
  perMemberRegCharge: number | string;
  commPerMemberPerMonth?: number | string;

  memberLimit?: number | string;
  disOnCaUptoMembers?: number | string;
  descreaseCaByPercentage?: number | string;

  fBalPrInCa?: number | string;
  cBalPrInCa: number | string;
  vBalPrInCa?: number | string;

  graceDays: number | string;
  guestAllowed: string | boolean;
  clubAccess: string | boolean;

  birthdayVenueUsage?: number | string;
  anniversaryVenueUsage?: number | string;
  cancelChargesPrOnCa?: number | string;
  entityType?: string;
}

export default function MembershipExcelUpload({
  isOpen,
  onClose,
  onSuccess,
}: MembershipExcelUploadProps) {
  const expectedColumns = useMemo(
    () => [
      "membershipType",
      "introductionDate",
      "suspensionDate",
      "billingEntityOfFamily",
      "membershipDetails",
      "durationDays",
      "caDepositPR",
      "minIssueCharge",
      "perMemberRegCharge",
      "commPerMemberPerMonth",
      "memberLimit",
      "disOnCaUptoMembers",
      "descreaseCaByPercentage",
      "fBalPrInCa",
      "cBalPrInCa",
      "vBalPrInCa",
      "graceDays",
      "guestAllowed",
      "clubAccess",
      "birthdayVenueUsage",
      "anniversaryVenueUsage",
      "cancelChargesPrOnCa",
      "entityType",
    ],
    []
  );

  const handleCreateMembership = useCallback(
    async (row: MembershipImportRow) => {
      // const parseBoolToInt = (val: any): number =>
      // 	val === true || String(val).toLowerCase() === 'true' || String(val) === '1' ? 1 : 0;

      const parseBool = (val: any): boolean =>
        val === true ||
        String(val).toLowerCase() === "true" ||
        String(val) === "1";

      const payload: MembershipMaster | any = {
        membershipType: row.membershipType,

        introductionDate: row.introductionDate
          ? (new Date(row.introductionDate).toISOString().split("T")[0] as any)
          : undefined,

        suspensionDate: row.suspensionDate
          ? (new Date(row.suspensionDate).toISOString().split("T")[0] as any)
          : undefined,

        billingEntityOfFamily: row.billingEntityOfFamily,
        membershipDetails: row.membershipDetails,

        durationDays: Number(row.durationDays),
        caDepositPR: Number(row.caDepositPR),
        minIssueCharge: Number(row.minIssueCharge),
        perMemberRegCharge: Number(row.perMemberRegCharge),

        memberLimit: row.memberLimit ? Number(row.memberLimit) : 0,
        disOnCaUptoMembers: Number(row.disOnCaUptoMembers || 0),
        descreaseCaByPercentage: Number(row.descreaseCaByPercentage || 0),

        fBalPrInCa: Number(row.fBalPrInCa || 0),
        cBalPrInCa: Number(row.cBalPrInCa),
        vBalPrInCa: Number(row.vBalPrInCa || 0),

        graceDays: Number(row.graceDays),

        guestAllowed: row.guestAllowed as any,
        clubAccess: parseBool(row.clubAccess),

        birthdayVenueUsage: Number(row.birthdayVenueUsage || 0),
        anniversaryVenueUsage: Number(row.anniversaryVenueUsage || 0),
        cancelChargesPrOnCa: (row.cancelChargesPrOnCa as any) || 0,
        entityType: row.entityType,
        status: "active",
      };

      await createMembershipMaster(payload);
      console.log(`✅ Imported Membership: ${payload.membershipType}`);
    },
    []
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl h-[85vh] bg-white dark:bg-slate-950 rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Bulk Import Memberships
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Upload membership master configurations via Excel sheet.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden p-6 bg-gray-50 dark:bg-slate-900/50">
              <ExcelUpload<MembershipImportRow>
                title="Membership Master Sheet"
                expectedColumns={expectedColumns}
                createFunction={handleCreateMembership}
                onUploadComplete={onSuccess}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
