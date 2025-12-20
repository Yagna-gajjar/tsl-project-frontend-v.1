import { useState, useRef } from "react";
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
import { X, Loader2 } from "lucide-react";

type Option = { label: string; value: number | string | Date };

export type FieldType =
  | "text"
  | "email"
  | "number"
  | "password"
  | "textarea"
  | "select"
  | "multiselect"
  | "checkbox"
  | "date";

interface Props {
  type: FieldType;
  name: string;
  label: string;
  value: any;
  onChange: (v: any) => void;
  placeholder?: string;
  description?: string;
  required?: boolean;
  error?: string;
  options?: Option[];
  disabled?: boolean;
  className?: string;
  index?: number;
  minDate?: string | Date;
  maxDate?: string | Date;
  // Infinite Loading Props
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

function SearchableMultiselect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  onLoadMore,
  isLoadingMore,
}: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const valueStrings = new Set((value || []).map((v: any) => String(v)));
  const filteredOptions = options.filter((opt: Option) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleOption = (optionValue: any) => {
    const current = Array.isArray(value) ? value : [];
    const isSelected = valueStrings.has(String(optionValue));
    if (isSelected) {
      onChange(current.filter((v) => String(v) !== String(optionValue)));
    } else {
      onChange([...current, optionValue]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex flex-wrap items-center gap-2 p-2 border rounded-md bg-background min-h-10 cursor-pointer ${
          isOpen ? "ring-2 ring-ring" : ""
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {value?.length > 0 ? (
          value.map((val: any) => (
            <span
              key={String(val)}
              className="bg-primary/10 text-primary px-2 py-0.5 rounded-sm text-xs flex items-center gap-1"
            >
              {options.find((o: any) => String(o.value) === String(val))
                ?.label || val}
              <X
                size={12}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(val);
                }}
              />
            </span>
          ))
        ) : (
          <span className="text-muted-foreground text-sm pl-1">
            {placeholder}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full w-full z-50 mt-1 bg-popover border rounded-md shadow-md overflow-hidden">
          <div className="p-2 border-b">
            <Input
              autoFocus
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
            />
          </div>
          <div style={{ height: "250px" }}>
            <Virtuoso
              data={filteredOptions}
              endReached={onLoadMore}
              itemContent={(_index, opt) => {
                const isSelected = valueStrings.has(String(opt.value));
                return (
                  <div
                    onClick={() => toggleOption(opt.value)}
                    className={`flex items-center px-3 py-2 cursor-pointer hover:bg-accent ${
                      isSelected ? "bg-accent/50" : ""
                    }`}
                  >
                    <div
                      className={`mr-2 w-4 h-4 border rounded flex items-center justify-center ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-input"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-sm">{opt.label}</span>
                  </div>
                );
              }}
              components={{
                Footer: () =>
                  isLoadingMore ? (
                    <div className="p-2 flex justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : null,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function FormFieldInput(props: Props) {
  const {
    type,
    name,
    label,
    value,
    onChange,
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
            options={options || []}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            onLoadMore={onLoadMore}
            isLoadingMore={isLoadingMore}
          />
        );

      case "select":
        // Single select using virtualization logic
        return (
          <SearchableMultiselect
            options={options || []}
            value={value ? [value] : []}
            onChange={(vals: any[]) => {
              onChange(vals[vals.length - 1]);
            }}
            placeholder={placeholder}
            disabled={disabled}
            onLoadMore={onLoadMore}
            isLoadingMore={isLoadingMore}
          />
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal ${baseInputClass}`}
              >
                {value ? (
                  new Date(value).toLocaleDateString()
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={value} onSelect={onChange} />
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
            <Label htmlFor={name}>{label}</Label>
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
          />
        );
    }
  };

  return (
    <div className={`grid w-full items-center gap-1.5 ${className}`}>
      {type !== "checkbox" && (
        <Label htmlFor={name} className={error ? "text-destructive" : ""}>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      {renderField()}
      {error && (
        <p className="text-[0.8rem] font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}
