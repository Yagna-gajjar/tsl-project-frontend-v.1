import { useEffect, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { FilterToolProps } from '../types';
import FilterInputs from './filter-inputs';

export default function FilterTool<T>({ columns,
  filters,
  onFilterChange, }: FilterToolProps<T>) {

  const [tempFilters, setTempFilters] = useState<Record<string, string | number | Date | object | boolean | undefined>>(() => ({
    ...filters,
  }));
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    try {
      const parentStr = JSON.stringify(filters || {});
      const localStr = JSON.stringify(tempFilters || {});
      if (parentStr !== localStr) {
        setTempFilters({ ...filters });
        setShowApply(false);
      }
    } catch {
      setTempFilters({ ...filters });
      setShowApply(false);
    }
  }, [filters]);

  const activeFilterCount = Object.keys(filters).length;


  const applyFilters = () => {
    const parent = filters || {};
    const staged = tempFilters || {};

    Object.entries(staged).forEach(([k, v]) => {
      const prev = parent[k];
      const changed =
        prev === undefined
          ? true
          : prev instanceof Date && v instanceof Date
            ? prev.getTime() !== v.getTime()
            : String(prev) !== String(v);

      if (changed) {
        onFilterChange(k, v as string ?? "");
      }
    });

    Object.keys(parent).forEach((k) => {
      if (!(k in staged)) {
        onFilterChange(k, "");
      }
    });

    setTempFilters((p) => ({ ...p }));
    setShowApply(false);
  };

  const cancelFilters = () => {
    setTempFilters({ ...filters });
    setShowApply(false);
  };

  const clearAllFilters = () => {
    const filterKeys = columns
      .filter((col) => col.filterType)
      .map((col) => String(col.key));
    filterKeys.forEach((k) => {
      if (filters && k in filters) onFilterChange(k, "");
    });
    setTempFilters({});
    setShowApply(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-dashed bg-transparent"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filter
          {activeFilterCount > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {activeFilterCount}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {activeFilterCount > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {activeFilterCount} selected
                  </Badge>
                ) : (
                  columns
                    .filter((col) => filters[String(col.key)])
                    .map((col) => (
                      <Badge
                        variant="secondary"
                        key={String(col.key)}
                        className="rounded-sm px-1 font-normal"
                      >
                        {col.header}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="max-w-[320px] max-h-[400px] p-4 overflow-auto"
        align="start"
      >

        <div className="space-y-4">
          <div className="font-medium flex justify-between items-center leading-none">
            <span>Filters </span>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                className="w-1/2 bg-blue-100 justify-center text-blue-600"
                onClick={clearAllFilters}
              >
                Clear filters
              </Button>
            )}
          </div>
          <div className="space-y-4">
            {columns
              .filter((col) => col.filterType)
              .map((col) => (
                <div key={String(col.key)} className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {col.header}
                  </label>
                  <FilterInputs column={col} setTempFilters={setTempFilters} setShowApply={setShowApply} onFilterChange={onFilterChange} tempFilters={tempFilters} />
                </div>
              ))}
          </div>

          <div className="flex gap-2">
            {showApply ? (
              <>
                <Button className="flex-1" onClick={applyFilters}>
                  Apply
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={cancelFilters}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>

      </PopoverContent>
    </Popover>
  )
}
