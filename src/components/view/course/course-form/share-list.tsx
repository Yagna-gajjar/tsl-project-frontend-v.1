import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CourseShare } from "@/types/courseShare";
import type { Entity } from "@/types/entity";
import type { Authority } from "@/types/authority";
import { getAuthorityByEntity } from "@/api/authority.api";
import type { Response } from "@/types/response";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Enums } from "@/types/enums";

interface SharesListProps {
  shares: CourseShare[];
  entityOptions: Entity[];
  errors: Record<string, string>;
  onChange: (index: number, field: keyof CourseShare, value: any) => void;
  onRemove: (index: number) => void;
  roleInCourse: Enums[];
}

export const SharesList = ({
  shares,
  entityOptions,
  onChange,
  onRemove,
  roleInCourse,
}: SharesListProps) => {
  /* -------------------- authority cache -------------------- */
  const [authorityMap, setAuthorityMap] = useState<Record<number, Authority[]>>(
    {}
  );

  /* -------------------- fetch authorities by entity -------------------- */
  const loadAuthorities = async (entityId: number) => {
    if (!entityId || authorityMap[entityId]) return;

    try {
      const res: Response<Authority[]> = await getAuthorityByEntity(entityId);
      setAuthorityMap((p) => ({
        ...p,
        [entityId]: res.data ?? [],
      }));
    } catch {
      setAuthorityMap((p) => ({ ...p, [entityId]: [] }));
    }
  };

  /* -------------------- keydown handler -------------------- */
  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    isLastField: boolean
  ) => {
    if (
      e.key === "Tab" &&
      !e.shiftKey &&
      isLastField &&
      index === shares.length - 1
    ) {
      e.preventDefault();
      // Logic to add a new row if necessary
      onChange(shares.length, "entityId", 0);
    }
  };

  return (
    <div className="space-y-1">
      {/* Header Grid */}
      <div className="grid grid-cols-[2fr,1.5fr,1fr,0.6fr,0.6fr,1.2fr,60px] gap-1 px-2 py-1 bg-muted/50 text-xs font-semibold border-b">
        <div>Entity*</div>
        <div>Role In Course*</div>
        <div>Share (%)*</div>
        <div className="text-center">CGST</div>
        <div className="text-center">SGST</div>
        <div>Approval Authority</div>
        <div />
      </div>

      <AnimatePresence mode="popLayout">
        {shares.map((share, index) => {
          const authorities =
            share.entityId && authorityMap[share.entityId]
              ? authorityMap[share.entityId]
              : [];

          return (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-[2fr,1.5fr,1fr,0.6fr,0.6fr,1.2fr,60px] gap-1 px-2 py-1 border-b hover:bg-muted/30 items-center"
            >
              {/* 1. Entity Selection */}
              <Select
                value={share.entityId ? String(share.entityId) : ""}
                onValueChange={(v) => {
                  const id = Number(v);
                  onChange(index, "entityId", id);
                  onChange(index, "approvalAuthorityId", null);
                  loadAuthorities(id);
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select Entity" />
                </SelectTrigger>
                <SelectContent>
                  {entityOptions.map((e) => (
                    <SelectItem key={e.entityId} value={String(e.entityId)}>
                      {e.entityName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 2. Role In Course Dropdown (Previously Input) */}
              <Select
                value={share.roleInCourse || ""}
                disabled={share.roleInCourse === "TSL"}
                onValueChange={(v) => onChange(index, "roleInCourse", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {roleInCourse.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 3. Share Percentage */}
              <Input
                type="number"
                min={0}
                max={100}
                className={cn(
                  "h-8 text-xs",
                  share.roleInCourse === "TSL" &&
                  "text-primary font-semibold"
                )}
                value={share.share}
                onChange={(e) =>
                  onChange(index, "share", Number(e.target.value))
                }
              />

              {/* 4. CGST */}
              <Input
                type="number"
                className="h-8 text-xs"
                value={share.cgst ?? ""}
                onChange={(e) =>
                  onChange(index, "cgst", Number(e.target.value))
                }
              />

              {/* 5. SGST */}
              <Input
                type="number"
                className="h-8 text-xs"
                value={share.sgst ?? ""}
                onChange={(e) =>
                  onChange(index, "sgst", Number(e.target.value))
                }
              />

              {/* 6. Approval Authority Dropdown */}
              <Select
                disabled={!share.entityId}
                value={share.approvalAuthorityId ? String(share.approvalAuthorityId) : ""}
                onValueChange={(v) =>
                  onChange(index, "approvalAuthorityId", Number(v))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue
                    placeholder={
                      share.entityId
                        ? "Select Authority"
                        : "Select entity first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {authorities.length > 0 ? (
                    authorities.map((a) => (
                      <SelectItem
                        key={a.authorityId}
                        value={String(a.authorityId)}
                      >
                        {a.memberFirstName} {a.memberLastName}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-xs text-muted-foreground">
                      No authorities found
                    </div>
                  )}
                </SelectContent>
              </Select>

              {/* 7. Action / Remove Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive justify-self-center"
                onKeyDown={(e) => handleKeyDown(e, index, true)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {shares.length === 0 && (
        <div className="p-8 text-center text-xs text-muted-foreground border-dashed border-2 rounded-md">
          No shares added. Tab through or click "Add Row" to begin.
        </div>
      )}
    </div>
  );
};