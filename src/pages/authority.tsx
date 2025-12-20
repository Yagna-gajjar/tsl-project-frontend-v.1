import { useState } from "react";
import AuthorityTable from "@/components/view/authority/authority-table";
import AuthorityFormModal from "@/components/view/authority/authority-form-modal";
import AuthorityViewModal from "@/components/view/authority/authority-view-modal";
import type { Authority } from "@/types/authority";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AuthorityPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editRow, setEditRow] = useState<Authority | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Authority Management</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Authority
        </Button>
      </div>
      <AuthorityTable
        refreshKey={refresh}
        onEdit={(r) => {
          setEditRow(r);
          setFormOpen(true);
        }}
        onView={(r) => {
          setViewId(r.authorityId!);
          setViewOpen(true);
        }}
      />

      <AuthorityFormModal
        isOpen={formOpen}
        initialData={editRow ?? undefined}
        onClose={() => {
          setFormOpen(false);
          setEditRow(null);
        }}
        onSave={() => setRefresh((v) => v + 1)}
      />

      <AuthorityViewModal
        isOpen={viewOpen}
        authorityId={viewId}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
}
