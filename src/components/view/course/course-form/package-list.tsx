import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Activity } from "@/types/activity";
import type { CoursePackage } from "@/types/coursePackage";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { getAuthorities } from "@/api/authority.api";
import type { Response } from "@/types/response";

type Authority = {
  authorityId: number;
  memberFirstName?: string;
  memberLastName?: string;
  accountName?: string;
};

interface PackagesListProps {
  packages: CoursePackage[];
  activityOptions: Activity[];
  errors: Record<string, string>;
  onChange: (index: number, field: keyof CoursePackage, value: any) => void;
  onRemove: (index: number) => void;
}

export const PackagesList = ({
  packages,
  activityOptions,
  onChange,
  onRemove,
}: PackagesListProps) => {
  const [authorityOptions, setAuthorityOptions] = useState<Authority[]>([]);
  const [loadingAuthorities, setLoadingAuthorities] = useState(false);

  // 🔥 FETCH AUTHORITIES HERE
  useEffect(() => {
    const fetchAuthorities = async () => {
      try {
        setLoadingAuthorities(true);

        const res: Response<Authority[]>|any = await getAuthorities();
        setAuthorityOptions(res?.data || []);
      } catch (err) {
        console.error("Failed to fetch authorities", err);
      } finally {
        setLoadingAuthorities(false);
      }
    };

    fetchAuthorities();
  }, []);

  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    isLastField: boolean
  ) => {
    if (
      e.key === "Tab" &&
      !e.shiftKey &&
      isLastField &&
      index === packages.length - 1
    ) {
      e.preventDefault();
      onChange(packages.length, "activityId", 0);
    }
  };

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr,1fr,1fr,60px] gap-1 px-2 py-1 bg-muted/50 text-xs font-semibold border-b">
        <div>Activity</div>
        <div>Link Type*</div>
        <div>Approval Authority</div>
        <div></div>
      </div>

      <AnimatePresence mode="popLayout">
        {packages.map((pkg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.15 }}
            layout
            className="grid grid-cols-[1fr,1fr,1fr,60px] gap-1 px-2 py-1 border-b hover:bg-muted/30 items-center"
          >
            {/* Activity */}
            <div>
              <Select
                value={pkg.activityId ? String(pkg.activityId) : ""}
                onValueChange={(v) => onChange(index, "activityId", Number(v))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select Activity" />
                </SelectTrigger>
                <SelectContent>
                  {activityOptions.map((a) => (
                    <SelectItem key={a.activityId} value={String(a.activityId)}>
                      {a.activityName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Link Type */}
            <div>
              <Select
                value={pkg.linkType || ""}
                onValueChange={(v) => onChange(index, "linkType", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select Link Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pre">Pre</SelectItem>
                  <SelectItem value="Post">Post</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Approval Authority */}
            <div>
              <Select
                disabled={loadingAuthorities}
                value={
                  pkg.approvalAuthorityId ? String(pkg.approvalAuthorityId) : ""
                }
                onValueChange={(v) =>
                  onChange(index, "approvalAuthorityId", Number(v))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue
                    placeholder={
                      loadingAuthorities ? "Loading..." : "Select Authority"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {authorityOptions.map((auth) => (
                    <SelectItem
                      key={auth.authorityId}
                      value={String(auth.authorityId)}
                    >
                      {auth.memberFirstName} {auth.memberLastName}
                      {auth.accountName ? ` (${auth.accountName})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Remove */}
            <div className="flex justify-center">
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
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {packages.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-muted-foreground text-sm"
        >
          <p>No packages added yet. Click "Add Package" to get started.</p>
        </motion.div>
      )}
    </div>
  );
};
