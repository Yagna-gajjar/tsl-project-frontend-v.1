import { useEffect, useState } from "react";
import { Plus, Upload } from "lucide-react";
import type { Entity } from "@/types/entity";
import EntityTable from "@/components/view/entity/entity-table";
import EntityFormModal from "@/components/view/entity/entity-form-modal";
import EntityViewModal from "@/components/view/entity/entity-view-modal";
import { Button } from "@/components/ui/button";
import EntityExcelUpload from "@/components/view/entity/entity-excel-upload";
import { SearchableMultiselect } from "@/components/form-modal/form-field-input";
import type { Enums } from "@/types/enums";
import type { Response } from "@/types/response";
import { getEnumsByCategory } from "@/api/enums.api";

export default function EntityPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editRow, setEditRow] = useState<Entity>();
  const [viewId, setViewId] = useState<number>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [excelOpen, setExcelOpen] = useState(false);
    const [entityTypeEnums, setEntityTypeEnums] = useState<Enums[]>([]);
    const [entityType, setEntityType] = useState<string>("all");

  const bumpRefresh = () => setRefreshKey((s) => s + 1);

    useEffect(() => {
      const fetchEntityTypes = async () => {
        const res: Response<Enums[]> = await getEnumsByCategory("ENTITY TYPE", {
          enumCase: "2,5,6,3",
        });
        setEntityTypeEnums(res.data || []);
      };
  
      fetchEntityTypes();
    }, []);

  const handleSaved = () => {
    bumpRefresh();
  };
 
  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Entity Management</h1>
        <div className="flex items-center gap-3">
      <div className="w-1/4">
        </div>

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
            <Plus className="w-4 h-4 mr-2" /> Add Entity
          </Button>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <div className="w-1/4">
      
      <SearchableMultiselect
            isSingle
            placeholder="Entity Type"
            value={entityType === "all" ? null : entityType}
            options={[
              { label: "All", value: "all" },
              ...entityTypeEnums.map((e) => ({
                label: e.value,
                value: e.value,
              })),
            ]}
            onChange={(v) => setEntityType(v ?? "all")}
          />
          </div>
          </div>
      <EntityTable
        refreshKey={refreshKey}
        onEdit={(r) => {
          setEditRow(r);
          setFormOpen(true);
        }}
        onView={(r) => {
          setViewId(r.entityId);
          setViewOpen(true);
        }}
      />

      <EntityFormModal
        isOpen={formOpen}
        initialData={editRow}
        onClose={() => {
          setFormOpen(false);
          setEditRow(undefined);
        }}
        onSave={() => setRefreshKey((p) => p + 1)}
        entityType={entityType}
      />

      <EntityViewModal
        isOpen={viewOpen}
        entityId={viewId}
        onClose={() => setViewOpen(false)}
      />

      <EntityExcelUpload
        isOpen={excelOpen}
        onClose={() => setExcelOpen(false)}
        onSuccess={() => {
          handleSaved();
        }}
      />
    </div>
  );
}
