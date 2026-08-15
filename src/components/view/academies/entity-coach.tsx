import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEntityById } from "@/api/entity.api";
import { toast } from "@/hooks/use-toast";
import type { Entity } from "@/types/entity";
import CoachTable from "@/components/view/academies/coach-table";

export default function EntityCoach() {
  const navigate = useNavigate();
  const location = useLocation()
  const { entityId } = location.state
  const [entity, setEntity] = useState<Entity | null>(null);

  useEffect(() => {
    if (!entityId) return;
    (async () => {
      try {
        const res = await getEntityById(Number(entityId));
        setEntity(res.data ?? null);
      } catch {
        toast({
          title: "Failed to load academy details",
          variant: "destructive",
        });
      }
    })();
  }, [entityId]);

  if (!entityId) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/staff-management/academies")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            {entity?.entityName ?? "Academy"} — Members
          </h1>
          <p className="text-sm text-muted-foreground">
            {entity?.entityType ? `${entity.entityType} · ` : ""}
            Registered{" "}
            {entity?.regDate
              ? new Date(entity.regDate).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
      </div>

      <CoachTable entityId={Number(entityId)} />
    </div>
  );
}