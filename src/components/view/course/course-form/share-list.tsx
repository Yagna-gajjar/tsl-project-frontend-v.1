import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CourseShare } from "@/types/courseShare";
import type { Entity } from "@/types/entity";
import type { Authority } from "@/types/authority";
import { getAuthorities, getAuthorityByEntity } from "@/api/authority.api";
import type { Response } from "@/types/response";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SharesListProps {
  shares: CourseShare[];
  entityOptions: Entity[];
  errors: Record<string, string>;
  onChange: (index: number, field: keyof CourseShare, value: any) => void;
  onRemove: (index: number) => void;
}

export const SharesList = ({
  shares,
  entityOptions,
  onChange,
  onRemove,
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
      onChange(shares.length, "entityId", 0);
    }
  };

  return (
    <div className="space-y-1">
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
              className="grid grid-cols-[2fr,1.5fr,1fr,0.6fr,0.6fr,1.2fr,60px] gap-1 px-2 py-1 border-b hover:bg-muted/30 items-center"
            >
              {/* Entity */}
              <Select
                value={String(share.entityId || "")}
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

              {/* Role In Course */}
              <Input
                className="h-8 text-xs"
                value={share.roleInCourse}
                onChange={(e) =>
                  onChange(index, "roleInCourse", e.target.value)
                }
                disabled={share.roleInCourse === "TSL Charges"}
              />

              {/* Share */}
              <Input
                type="number"
                min={0}
                max={100}
                className={cn(
                  "h-8 text-xs",
                  share.roleInCourse === "TSL Charges" &&
                    "text-primary font-semibold"
                )}
                value={share.share}
                onChange={(e) =>
                  onChange(index, "share", Number(e.target.value))
                }
              />

              {/* CGST */}
              <Input
                type="number"
                className="h-8 text-xs"
                value={share.cgst ?? ""}
                onChange={(e) =>
                  onChange(index, "cgst", Number(e.target.value))
                }
              />

              {/* SGST */}
              <Input
                type="number"
                className="h-8 text-xs"
                value={share.sgst ?? ""}
                onChange={(e) =>
                  onChange(index, "sgst", Number(e.target.value))
                }
              />

              {/* Approval Authority (Dropdown) */}
              <Select
                disabled={!share.entityId}
                value={String(share.approvalAuthorityId || "")}
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
                  {authorities.map((a) => (
                    <SelectItem
                      key={a.authorityId}
                      value={String(a.authorityId)}
                    >
                      {a.memberFirstName} {a.memberLastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Delete */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                onKeyDown={(e) => handleKeyDown(e, index, true)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
