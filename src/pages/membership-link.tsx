import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

import MembershipLinkTable from "@/components/view/membershipLink/membership-link-table";
import MembershipLinkFormModal from "@/components/view/membershipLink/membership-link-form-modal";
import MembershipLinkViewModal from "@/components/view/membershipLink/membership-link-view-modal";
import type { MembershipLink } from "@/types/membershipLink";
import MembershipLinkExcelUpload from "@/components/view/membershipLink/membershipLink-excel-upload";

export default function MembershipLinkPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [_, setEditRow] = useState<MembershipLink>();
  const [viewId, setViewId] = useState<number>();
  const [excelOpen, setExcelOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const bumpRefresh = () => setRefreshKey((s) => s + 1);
  const handleSaved = () => {
    bumpRefresh();
  };


  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Membership Links</h1>
        <div className="flex items-center gap-3">

          <Button
            variant="outline"
            size="lg"
            onClick={() => setExcelOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <Upload className="w-5 h-5" />
            Upload Excel
          </Button>

          <Button onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Link
          </Button>

        </div>
      </div>

      <MembershipLinkTable
        refreshKey={refreshKey}
        onEdit={(r) => {
          setEditRow(r);
          setFormOpen(true);
        }}
        onView={(r) => {
          setViewId(r.membershipLinkId);
          setViewOpen(true);
        }}
      />

      <MembershipLinkFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditRow(undefined);
        }}
        onSave={() => setRefreshKey((p) => p + 1)}
      />

      <MembershipLinkViewModal
        isOpen={viewOpen}
        membershipLinkId={viewId}
        onClose={() => setViewOpen(false)}
      />

      <MembershipLinkExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={() => {
          handleSaved();
        }}
      />
    </div>
  );
}
