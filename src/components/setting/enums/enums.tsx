import { motion } from "framer-motion";
import { useState } from "react";
import EnumsTable from "@/components/setting/enums/enums-table";
import EnumsFormModal from "@/components/setting/enums/enums-form-modal";
import EnumsViewModal from "@/components/setting/enums/enums-view-modal";
import type { Enums } from "@/types/enums";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EnumsPage() {
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<Enums | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState<Partial<Enums> | null>(null);

  // increment this to trigger table refresh
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const bumpRefresh = () => setRefreshKey((s) => s + 1);

  const openView = (row: Enums) => {
    setViewData(row);
    setViewOpen(true);
  };

  const openForm = (row?: Partial<Enums> | null) => {
    setEditRow(row ?? null);
    setFormOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 space-y-6"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Enums Management</h1>
          <p className="text-muted-foreground">
            Manage application enums (lookup values, statuses, roles, etc.).
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2"
        >
          <Plus className="w-5 h-5" />
          Add Enum
        </Button>
      </div>

      <EnumsTable
        onView={openView}
        onEdit={(r) => openForm(r)}
        refreshKey={refreshKey}
      />

      <EnumsViewModal
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewData(null);
        }}
        item={viewData}
      />

      <EnumsFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        initialData={editRow ?? undefined}
        onSaved={() => {
          bumpRefresh();
        }}
      />
    </motion.div>
  );
}
