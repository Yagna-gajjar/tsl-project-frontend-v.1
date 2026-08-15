import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Hash } from "lucide-react";
import type { Entity } from "@/types/entity";

type Props = {
  entity: Entity;
  onClick?: (entity: Entity) => void;
};

// Stable color per type so the same type always reads the same way across
// the grid, without needing a server-defined color field.
const TYPE_COLORS = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
];

function colorForType(type: string) {
  if (!type) {
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
  let hash = 0;
  for (let i = 0; i < type.length; i++) hash = (hash * 31 + type.charCodeAt(i)) | 0;
  return TYPE_COLORS[Math.abs(hash) % TYPE_COLORS.length];
}

export function EntityCard({ entity, onClick }: Props) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(entity)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(entity);
        }
      }}
      className="group cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <h3 className="truncate font-semibold leading-tight transition-colors group-hover:text-primary">
            {entity.entityName}
          </h3>
        </div>
        <Badge className={`shrink-0 capitalize ${colorForType(entity.entityType)}`} variant="outline">
          {entity.entityType}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-0 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>
            Registered{" "}
            {entity.regDate ? new Date(entity.regDate).toLocaleDateString() : "N/A"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Hash className="h-3.5 w-3.5 shrink-0" />
          <span>ID: {entity.entityId}</span>
        </div>
      </CardContent>
    </Card>
  );
}