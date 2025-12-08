// MembershipMasterPage.tsx
"use client";

import { useState } from "react";
import MembershipMasterTable from "@/components/view/memberShipMaster/memberShipMaster-table";
import MembershipMasterFormModal from "@/components/view/memberShipMaster/membershipMaster-form-modal";
import MembershipMasterViewModal from "@/components/view/memberShipMaster/membershipMaster-view-modal";
import type { membershipMaster } from "@/types/memberShipMaster";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function MembershipMasterPage() {
  // view modal state: keep selected id (or null)
  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);

  // form modal state: editing row object or null for create
  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<membershipMaster | null>(null);

  // increment to trigger table refresh
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const bumpRefresh = () => setRefreshKey((s) => s + 1);

  const openView = (row: membershipMaster) => {
    setViewId(row.membershipMasterId ?? null);
    setViewOpen(true);
  };

  const openForm = (row?: membershipMaster | null) => {
    setEditRow(row ?? null);
    setFormOpen(true);
  };

  return (
    <div className="container mx-auto px-4 space-y-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Membership Master</h1>
          <p className="text-muted-foreground">
            Manage membership master records — create, edit and inspect details.
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-5 h-5" />
          Add Membership
        </Button>
      </div>

      <MembershipMasterTable
        onView={openView}
        // if your table supports an onEdit prop, pass it too:
        // onEdit={openForm}
        refreshKey={refreshKey}
      />

      <MembershipMasterViewModal
        isOpen={viewOpen}
        membershipMasterId={viewId ?? undefined}
        onClose={() => {
          setViewOpen(false);
          setViewId(null);
        }}
      />

      <MembershipMasterFormModal
        isOpen={formOpen}
        initialData={editRow ?? undefined}
        onClose={() => setFormOpen(false)}
        onSave={() => {
          bumpRefresh();
        }}
      />
    </div>
  );
}
