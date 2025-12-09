import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

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
  value: number|string|Date;
  onChange: (v: any) => void;
  placeholder?: string;
  description?: string;
  required?: boolean;
  error?: string;
  options?: Option[];
  disabled?: boolean;
  className?: string;
  index?: number;

  // NEW: optional min/max date for date field (string "yyyy-mm-dd" or Date)
  minDate?: string | Date;
  maxDate?: string | Date;
  icon: ReactNode
}

function SearchableMultiselect({
  options,
  value,
  onChange,
  placeholder = "Search and select options...",
  disabled = false,
}: {
  options: Option[];
  value: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const toggleOption = (optionValue: any) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const removeOption = (optionValue: any) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const clearAll = () => {
    onChange([]);
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Main Input Container */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex flex-wrap items-center gap-2 p-3 border rounded-lg bg-background transition-all cursor-pointer ${
          isOpen ? "border-primary ring-2 ring-primary/20" : "border-input"
        } ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary"
        }`}
      >
        {/* Selected Tags */}
        {selectedOptions.length > 0 ? (
          selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
            >
              {opt.label}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeOption(opt.value);
                }}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                type="button"
              >
                <X size={14} />
              </button>
            </span>
          ))
        ) : (
          <span className="text-muted-foreground text-sm">{placeholder}</span>
        )}

        <div className="flex-grow" />

        {/* Right Icons */}
        <div className="flex items-center gap-1">
          {selectedOptions.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="p-1 hover:bg-muted rounded transition-colors"
              type="button"
            >
              <X size={16} className="text-muted-foreground" />
            </button>
          )}
          <ChevronDown
            size={18}
            className={`text-muted-foreground transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-input rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-input">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = value.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleOption(opt.value)}
                    type="button"
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-foreground"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-input"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-primary-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm">{opt.label}</span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FormFieldInput({
  type,
  name,
  label,
  value,
  onChange,
  placeholder,
  description,
  required,
  error,
  options,
  disabled,
  className = "",
  minDate,
  maxDate,
}: Props) {
  const baseInputClass = `${error ? "border-red-500" : ""}`;

  if (type === "checkbox") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Checkbox
          id={name}
          checked={!!value}
          onCheckedChange={(v) => onChange(Boolean(v))}
          disabled={disabled}
        />
        <Label htmlFor={name} className={error ? "text-red-500" : ""}>
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {error && (
          <p id={`${name}-error`} className="text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }

  const normalizeToStartOfDay = (d?: string | Date) => {
    if (!d) return undefined;
    if (d instanceof Date) {
      const dt = new Date(d);
      dt.setHours(0, 0, 0, 0);
      return dt;
    }
    const dt = new Date(String(d) + "T00:00:00");
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  const minDt = normalizeToStartOfDay(minDate);
  const maxDt = normalizeToStartOfDay(maxDate);

  const isOutOfRange = (d?: Date | null) => {
    if (!d) return false;
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    if (minDt && nd < minDt) return true;
    if (maxDt && nd > maxDt) return true;
    return false;
  };

  const renderField = () => {
    switch (type) {
      case "textarea":
        return (
          <Textarea
            id={name}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`min-h-24 resize-none ${baseInputClass}`}
            aria-invalid={!!error}
          />
        );

      case "select":
        return (
          <Select
            value={String(value ?? "")}
            onValueChange={(v) => onChange(v)}
            disabled={disabled}
          >
            <SelectTrigger className={baseInputClass} aria-invalid={!!error}>
              <SelectValue
                placeholder={placeholder ?? `Select ${label.toLowerCase()}`}
              />
            </SelectTrigger>
            <SelectContent>
              {options?.map((opt) => (
                <SelectItem
                  className={className}
                  key={String(opt.value)}
                  value={String(opt.value)}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        return (
          <SearchableMultiselect
            options={options || []}
            value={Array.isArray(value) ? value.map(String) : []}
            onChange={onChange}
            placeholder={placeholder ?? `Select ${label.toLowerCase()}`}
            disabled={disabled}
          />
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-between ${baseInputClass}`}
                disabled={disabled}
              >
                {value && value instanceof Date
                  ? value.toLocaleDateString()
                  : value
                    ? new Date(value).toLocaleDateString()
                    : placeholder || `Select ${label.toLowerCase()}`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={
                  value && value instanceof Date
                    ? value
                    : value
                      ? new Date(value)
                      : undefined
                }
                disabled={
                  minDt || maxDt
                    ? [
                      ...(minDt ? [{ before: minDt }] : []),
                      ...(maxDt ? [{ after: maxDt }] : []),
                    ]
                    : undefined
                }
                onSelect={(d) => {
                  if (!d) return onChange("");
                  const picked = d as Date;
                  if (isOutOfRange(picked)) return;
                  onChange(picked);
                }}
              />
            </PopoverContent>
          </Popover>
        );

      default:
        return (
          <Input
            id={name}
            type={type}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={baseInputClass}
            aria-invalid={!!error}
          />
        );
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Label
          htmlFor={name}
          className={`${error ? "text-red-500" : "text-sm font-medium"}`}
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
      </div>

      {renderField()}

      {description && (
        <p id={`${name}-desc`} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

export { SearchableMultiselect as MultiSelect };
