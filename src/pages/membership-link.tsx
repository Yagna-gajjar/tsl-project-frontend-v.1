import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import MembershipLinkTable from "@/components/view/membershipLink/membership-link-table";
import MembershipLinkFormModal from "@/components/view/membershipLink/membership-link-form-modal";
import MembershipLinkViewModal from "@/components/view/membershipLink/membership-link-view-modal";
import type { MembershipLink } from "@/types/membershipLink";

export default function MembershipLinkPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editRow, setEditRow] = useState<MembershipLink>();
  const [viewId, setViewId] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Membership Links</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Link
        </Button>
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
        initialData={editRow}
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
    </div>
  );
}
