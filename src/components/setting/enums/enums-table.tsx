import { useEffect, useState } from "react";
import { getAllEnumByGroup, deleteEnum, createEnum } from "@/api/enums.api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Search } from "lucide-react";
import type { Enums } from "@/types/enums";

interface EnumGroup {
  category: string;
  values: string[];
  ids: number[];
}

export default function EnumsGroupedTable() {
  const [groups, setGroups] = useState<EnumGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res: any = await getAllEnumByGroup();
      if (!res?.success) throw new Error();
      setGroups(res.data || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load enums",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ---------- SEARCH LOGIC ---------- */
  const filteredGroups = groups.filter((group) => {
    // ❌ hide empty groups always
    if (group.values.length === 0) return false;

    // no search → show group
    if (!search.trim()) return true;

    const q = search.toLowerCase();

    // match category
    if (group.category.toLowerCase().includes(q)) return true;

    // match any value
    return group.values.some((v) => v.toLowerCase().includes(q));
  });

  /* ---------- ADD VALUE ---------- */
  const handleAddValue = async (group: EnumGroup) => {
    const value = newValues[group.category]?.trim();
    if (!value) return;

    try {
      const res = await createEnum({
        category: group.category,
        value,
      } as Enums);

      if (!res?.success) throw new Error();

      await loadData();

      setNewValues((p) => ({ ...p, [group.category]: "" }));

      toast({
        title: "Added",
        description: "Value added successfully",
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to add value",
        variant: "destructive",
      });
    }
  };

  /* ---------- DELETE VALUE ---------- */
  const handleDeleteValue = async (groupIndex: number, valueIndex: number) => {
    const enumId = groups[groupIndex].ids[valueIndex];

    try {
      const res = await deleteEnum(enumId);
      if (!res?.success) throw new Error();

      setGroups((prev) =>
        prev.map((g, gi) => {
          if (gi !== groupIndex) return g;
          return {
            ...g,
            values: g.values.filter((_, vi) => vi !== valueIndex),
            ids: g.ids.filter((_, vi) => vi !== valueIndex),
          };
        })
      );

      toast({
        title: "Deleted",
        description: "Value removed successfully",
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete value",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      {/* SEARCH */}
      <div className="flex items-center gap-2 max-w-sm">
        <Search size={18} className="text-slate-400" />
        <Input
          placeholder="Search category or value..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredGroups.map((group, gi) => (
        <div key={group.category} className="border rounded-xl p-4 bg-white">
          <h3 className="font-semibold mb-3">{group.category}</h3>

          <div className="flex flex-wrap gap-2 mb-4">
            {group.values.map((val, vi) => (
              <div
                key={group.ids[vi]}
                className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full text-sm"
              >
                <span>{val}</span>
                <button
                  onClick={() => handleDeleteValue(gi, vi)}
                  className="text-slate-500 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 max-w-sm">
            <Input
              placeholder="Add value"
              value={newValues[group.category] || ""}
              onChange={(e) =>
                setNewValues((p) => ({
                  ...p,
                  [group.category]: e.target.value,
                }))
              }
            />
            <Button size="sm" onClick={() => handleAddValue(group)}>
              <Plus size={16} />
            </Button>
          </div>
        </div>
      ))}

      {filteredGroups.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No matching enums found
        </div>
      )}
    </div>
  );
}
