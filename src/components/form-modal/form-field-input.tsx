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

type Option = { label: string; value: any };

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

  // NEW: optional min/max date for date field (string "yyyy-mm-dd" or Date)
  minDate?: string | Date;
  maxDate?: string | Date;
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

  function toLocalYMD(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  // Normalize supplied min/max to start-of-day Date objects (or undefined)
  const normalizeToStartOfDay = (d?: string | Date) => {
    if (!d) return undefined;
    if (d instanceof Date) {
      const dt = new Date(d);
      dt.setHours(0, 0, 0, 0);
      return dt;
    }
    // assume "yyyy-mm-dd" (or other ISO-ish) string; append T00:00:00 for local parsing
    // If your strings are already ISO with timezone, adjust accordingly.
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
                <SelectItem key={String(opt.value)} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        return (
          <select
            id={name}
            multiple
            value={Array.isArray(value) ? value.map(String) : []}
            onChange={(e) => {
              const vals = Array.from(e.target.selectedOptions).map(
                (o) => o.value
              );
              onChange(vals);
            }}
            disabled={disabled}
            className={`p-2 rounded border ${baseInputClass}`}
          >
            {options?.map((opt) => (
              <option key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
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
                {
                  (value && value.toString().length === 10
                    ? value
                    : value
                    ? new Date(value).toLocaleDateString()
                    : placeholder || `Select ${label.toLowerCase()}`) as string
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                // Try to provide disabled ranges to Calendar if it accepts them.
                // react-day-picker style: disabled accepts [{ before: Date }, { after: Date }]
                // we cast to any because Calendar's type might differ in your project
                disabled={
                  minDt || maxDt
                    ? [
                        ...(minDt ? [{ before: minDt }] : []),
                        ...(maxDt ? [{ after: maxDt }] : []),
                      ]
                    : undefined
                }
                onSelect={(d) => {
                  // d can be Date | undefined | null depending on Calendar
                  if (!d) return onChange("");
                  const picked = d as Date;
                  if (isOutOfRange(picked)) {
                    // ignore out-of-range selections.
                    // optional: show toast/feedback here if you want
                    return;
                  }
                  onChange(toLocalYMD(picked));
                }}
                // If your Calendar supports custom day rendering, you could further style out-of-range days.
                // For compatibility we won't rely on that prop; disabled + onSelect guard are sufficient.
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
