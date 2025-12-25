import { useState, useRef, useEffect, useMemo } from "react";
import { Virtuoso } from "react-virtuoso";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Loader2, ChevronDown } from "lucide-react";

export type Option = {
  label: string | number;
  value: string | number | boolean;
};

interface SearchableMultiselectProps {
  options?: Option[];
  value?: any;
  onChange: (value: any) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  isSingle?: boolean;
}

export function SearchableMultiselect({
  options = [],
  value = [],
  onChange,
  onSearch,
  placeholder,
  disabled,
  onLoadMore,
  isLoadingMore,
  isSingle = false,
}: SearchableMultiselectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedValues = useMemo(() => {
    if (value === null || value === undefined) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const filteredOptions = useMemo(() => {
    return options.filter((opt) => {
      const label = opt?.label?.toString() || "";
      return label.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [options, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optionValue: any) => {
    if (isSingle) {
      onChange(optionValue);
      setIsOpen(false);
      return;
    }

    const isSelected = selectedValues.some(
      (v: any) => String(v) === String(optionValue)
    );
    if (isSelected) {
      onChange(
        selectedValues.filter((v: any) => String(v) !== String(optionValue))
      );
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 p-2 border rounded-md bg-background cursor-pointer transition-all ${isOpen ? "ring-2 ring-ring border-primary" : "border-input"
          } ${disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:border-accent-foreground/30"
          }`}
      >
        <div className="flex flex-wrap gap-1 flex-1 min-h-[1.5rem]">
          {selectedValues.length > 0 ? (
            selectedValues.map((val) => {
              const opt = options.find((o) => String(o.value) === String(val));
              return (
                <span
                  key={String(val)}
                  className={`${!isSingle
                      ? `bg-primary/10 text-primary text-xs border border-primary/20`
                      : `text-sm`
                    } px-2 py-0.5 rounded-sm flex items-center gap-1`}
                >
                  {opt?.label ?? val}
                  {!disabled && !isSingle && (
                    <X
                      size={12}
                      className="cursor-pointer hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOption(val);
                      }}
                    />
                  )}
                </span>
              );
            })
          ) : (
            <span className="text-muted-foreground text-sm pl-1">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""
            }`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full w-full shadow-md z-[100] mt-1 bg-popover border border-border rounded-md overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b bg-muted/30">
            <Input
              autoFocus
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                const query = e.target.value;
                setSearchQuery(query); // Local filter
                onSearch?.(query);    // External callback
              }}
              className="h-8 bg-background"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div>
            {isLoadingMore && filteredOptions.length === 0 ? (
              <div className="flex justify-center items-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            ) : (
              <Virtuoso
                style={{
                  height: `${Math.min(filteredOptions.length * 42, 250)}px`,
                  minHeight: "42px",
                }}
                data={filteredOptions}
                endReached={onLoadMore}
                itemContent={(_index, opt) => {
                  const isSelected = selectedValues.some(
                    (v) => String(v) === String(opt.value)
                  );
                  return (
                    <div
                      key={String(opt.value)}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOption(opt.value);
                      }}
                      className={`flex items-center px-3 py-2.5 cursor-pointer transition-colors ${isSelected
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted/50"
                        }`}
                    >
                      <div
                        className={`mr-3 w-4 h-4 border rounded flex items-center justify-center transition-colors ${isSelected
                            ? "bg-primary border-primary"
                            : "border-input"
                          }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{opt.label}</span>
                    </div>
                  );
                }}
                components={{
                  Footer: () =>
                    isLoadingMore ? (
                      <div className="p-3 flex justify-center bg-muted/10">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      </div>
                    ) : null,
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FormFieldInput(props: any) {
  const {
    type,
    name,
    label,
    value,
    onChange,
    onSearch,
    placeholder,
    required,
    error,
    options,
    disabled,
    className,
    onLoadMore,
    isLoadingMore,
  } = props;

  const baseInputClass = error
    ? "border-destructive focus-visible:ring-destructive"
    : "";

  const renderField = () => {
    switch (type) {
      case "textarea":
        return (
          <Textarea
            {...props}
            id={name}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
          />
        );

      case "multiselect":
        return (
          <SearchableMultiselect
            options={options}
            value={value}
            onChange={onChange}
            onSearch={onSearch}
            placeholder={placeholder}
            disabled={disabled}
            onLoadMore={onLoadMore}
            isLoadingMore={isLoadingMore}
            isSingle={false}
          />
        );

      case "select":
        return (
          <SearchableMultiselect
            options={options}
            value={value}
            onChange={onChange}
            onSearch={onSearch} // Passed to component
            placeholder={placeholder}
            disabled={disabled}
            onLoadMore={onLoadMore}
            isLoadingMore={isLoadingMore}
            isSingle={true}
          />
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal ${baseInputClass}`}
                disabled={disabled}
              >
                {value ? (
                  new Date(value).toLocaleDateString()
                ) : (
                  <span>{placeholder || "Pick a date"}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={onChange}
              />
            </PopoverContent>
          </Popover>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={name}
              checked={!!value}
              onCheckedChange={onChange}
              disabled={disabled}
            />
            <Label htmlFor={name} className="cursor-pointer">
              {label}
            </Label>
          </div>
        );

      default:
        return (
          <Input
            id={name}
            type={type}
            value={value ?? ""}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
            placeholder={placeholder}
          />
        );
    }
  };

  return (
    <div className={`grid w-full items-center gap-1.5 ${className ?? ""}`}>
      {type !== "checkbox" && (
        <Label
          htmlFor={name}
          className={`${error ? "text-destructive" : ""} font-semibold text-sm`}
        >
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      {renderField()}
      {error && (
        <p className="text-[0.75rem] font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}