import { Button } from '@/components/ui/button';
import type { FilterInputProps } from '../types';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export default function FilterInputs<T>({ column,
  setTempFilters,
  setShowApply,
  onFilterChange,
  tempFilters }: FilterInputProps<T>) {

  const showApplyTimer = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (showApplyTimer.current) clearTimeout(showApplyTimer.current);
    };
  }, []);
  const debounceShowApply = () => {

    if (showApplyTimer.current) {
      clearTimeout(showApplyTimer.current);
    }
    showApplyTimer.current = window.setTimeout(() => {
      setShowApply(true);
    }, 250);
  };

  if (!column.filterType) return null;
  const key = String(column.key);
  const value = tempFilters[key];

  switch (column.filterType) {
    case "number":
      return (
        <Input
          type="number"
          placeholder={`Filter ${column.header}...`}
          value={value as string ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setTempFilters((p) => ({ ...p, [key]: v }));
            if (v === "" || v === null || v === undefined) {
              setTempFilters((p) => {
                const np = { ...p };
                delete np[key];
                return np;
              });
              onFilterChange(key, "");
              setShowApply(false);
              return;
            }
            debounceShowApply();
          }}
          className="h-8 w-full"
        />
      );
    case "select": {
      const key = String(column.key);
      const controlValue =
        key in tempFilters ? String(tempFilters[key]) : "all";

      return (
        <Select
          value={controlValue}
          onValueChange={(val) => {
            if (val === "all") {
              setTempFilters((p) => {
                const np = { ...p };
                delete np[key];
                return np;
              });
              onFilterChange(key, "");
              setShowApply(false);
              return;
            }

            const opt = column.filterOptions?.find(
              (o) => String(o.value) === val
            );

            const applied = opt ? opt.value : val;

            setTempFilters((p) => {
              const np = { ...p };
              np[key] = applied;
              return np;
            });

            onFilterChange(key, applied);
            setShowApply(false);
          }}
        >
          <SelectTrigger className="h-8 w-full">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {column.filterOptions?.map((opt) => (
              <SelectItem key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    case "date":
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-8 w-full justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(value as string, "dd MMM yyyy") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value as Date}
              onSelect={(date) => {
                setTempFilters((p) => ({ ...p, [key]: date }));
                debounceShowApply();
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    case "text":
      return (
        <Input
          placeholder={`Filter ${column.header}...`}
          value={value as string ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setTempFilters((p) => ({ ...p, [key]: v }));
            if (v === "" || v === null || v === undefined) {
              setTempFilters((p) => {
                const np = { ...p };
                delete np[key];
                return np;
              });
              onFilterChange(key, "");
              setShowApply(false);
              return;
            }
            debounceShowApply();
          }}
          className="h-8 w-full"
        />
      );
    default:
      return null;
  }

}
