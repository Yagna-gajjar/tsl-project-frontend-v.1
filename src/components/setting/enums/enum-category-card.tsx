import { motion } from "framer-motion";
import { MoreHorizontal, Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { EnumGroup, Enums as EnumItem } from "@/types/enums";

interface Props {
	group: EnumGroup;
	onEditItem: (item: EnumItem) => void;
	onCreateItem: () => void;
}

export function EnumCategoryCard({ group, onEditItem, onCreateItem }: Props) {

	const items: EnumItem[] = group.values.map((val, i) => ({
		id: group.ids[i],
		category: group.category,
		value: val,
		status: group.status[i],
		description: group.description[i],
		enumCase: group.enumCase[i],
	}));

	return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col"
    >
      {/* Card Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/50">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
          {group.category}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onCreateItem}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-[350px] overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onEditItem(item)}
            className="group flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div
                      className={`
							w-2 h-2 rounded-full ring-2 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900 
							${
                item.status
                  ? "bg-emerald-500 ring-emerald-100"
                  : "bg-slate-300 ring-slate-100"
              }
                    `}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {item.status ? "Active" : "Inactive"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex flex-col min-w-0">
                <span
                  className={`text-sm font-medium truncate ${
                    !item.status
                      ? "text-muted-foreground line-through decoration-slate-400"
                      : ""
                  }`}
                >
                  {item.value}
                  <span className="ml-2 text-xs text-muted-foreground">
                    Value: {item.enumCase}
                  </span>
                </span>

                {item.description && (
                  <span className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {item.description}
                  </span>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        ))}

        {items.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Empty Category
          </div>
        )}
      </div>
    </motion.div>
  );
}