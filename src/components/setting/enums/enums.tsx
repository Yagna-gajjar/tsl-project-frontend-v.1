"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Layers, RefreshCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { getAllEnumByGroup } from "@/api/enums.api";
import type { EnumGroup, Enums as EnumItem } from "@/types/enums";

import { EnumCategoryCard } from "./enum-category-card";
import { EditEnumSheet } from "./edit-enum-sheet";

export default function EnumsPage() {
  const [data, setData] = useState<EnumGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // State for the Edit Sheet
  const [editingItem, setEditingItem] = useState<EnumItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Defaults for creating a new item
  const [newItemCategory, setNewItemCategory] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await getAllEnumByGroup();
      if (res?.success && res?.data) {
        setData(res.data);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load enums", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Filter Logic
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const lower = search.toLowerCase();
    return data.filter(g =>
      g.category.toLowerCase().includes(lower) ||
      g.values.some(v => v.toLowerCase().includes(lower))
    );
  }, [data, search]);

  // Handlers
  const handleEdit = (item: EnumItem) => {
    setEditingItem(item);
    setNewItemCategory(""); // Clear create mode
    setIsSheetOpen(true);
  };

  const handleCreate = (category?: string) => {
    setEditingItem(null); // Clear edit mode
    setNewItemCategory(category || "");
    setIsSheetOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-8 min-h-screen bg-slate-50/50 dark:bg-zinc-950 transition-colors">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="text-indigo-500" /> Enum Master
          </h1>
          <p className="text-muted-foreground">Manage system constants and lookup values.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}><RefreshCcw className={loading ? "animate-spin" : ""} /></Button>
          <Button onClick={() => handleCreate()} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder="Filter by category or value..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-white dark:bg-zinc-900"
        />
      </div>

      {/* Masonry Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        <AnimatePresence mode="popLayout">
          {filteredData.map((group) => {
            return <EnumCategoryCard
              key={group.category}
              group={group}
              onEditItem={handleEdit}
              onCreateItem={() => handleCreate(group.category)}
            />
          })}
        </AnimatePresence>
      </motion.div>

      {/* The Sheet that handles ALL Add/Edit logic */}
      <EditEnumSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        initialData={editingItem}
        initialCategory={newItemCategory}
        onSaved={fetchData}
      />
    </div>
  );
}