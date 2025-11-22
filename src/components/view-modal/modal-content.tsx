"use client";

import type { FieldConfig } from "./types";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button"; // shadcn button

interface ModalContentProps<T> {
  data: T | null;
  fields: FieldConfig<T>[];
  layout: "grid" | "list";
  loading: boolean;
  error: string | null;
}

/**
 * FieldConfig extension (example)
 *
 * // in your ./types file, ensure FieldConfig supports:
 * // {
 * //   type?: 'text' | 'button' | ...,
 * //   button?: {
 * //     label: string,
 * //     onClick?: (data: T) => void,
 * //     variant?: string,
 * //     size?: 'sm'|'md'|'lg',
 * //     span?: 1 | 2   // grid span: 1 = one column, 2 = full two-column width
 * //   }
 * // }
 *
 * This implementation looks for field.type === 'button' or field.button to render a Button.
 */

export function ModalContent<T>({
  data,
  fields,
  layout,
  loading,
  error,
}: ModalContentProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-border border-t-blue-500 rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg m-6 text-destructive"
      >
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <div>
          <p className="font-medium">Error loading data</p>
          <p className="text-sm text-destructive/80">{error}</p>
        </div>
      </motion.div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available
      </div>
    );
  }

  // Grid layout (2-column responsive)
  if (layout === "grid") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, staggerChildren: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6"
      >
        {fields.map((field, idx) => {
          // If field declares button span (1 | 2), wrap FieldItem with a span class
          const span = (field as any).button?.span ?? 1;
          const spanClass = span === 2 ? "sm:col-span-2" : "sm:col-span-1";
          // Allow manual override via field.className as well
          const wrapperClass = `${spanClass} ${field.className ?? ""}`.trim();
          return (
            <div key={String(field.key)} className={wrapperClass}>
              <FieldItem<T>
                field={field}
                data={data}
                index={idx}
                layout={layout}
              />
            </div>
          );
        })}
      </motion.div>
    );
  }

  // List layout (vertical stacked)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, staggerChildren: 0.05 }}
      className="space-y-3 p-6"
    >
      {fields.map((field, idx) => (
        <FieldItem<T>
          key={String(field.key)}
          field={field}
          data={data}
          index={idx}
          layout={layout}
        />
      ))}
    </motion.div>
  );
}

interface FieldItemProps<T> {
  field: FieldConfig<T>;
  data: T;
  index: number;
  layout?: "grid" | "list";
}

function FieldItem<T>({
  field,
  data,
  index,
  layout = "grid",
}: FieldItemProps<T>) {
  const Icon = field.icon;
  const value = (data as any)[field.key];
  const renderedValue: any = field.render ? field.render(value, data) : value;

  // If this field is a button-type field or has button props -> render button
  const isButton = (field as any).type === "button" || !!(field as any).button;
  const btnProps = (field as any).button || {};

  if (isButton) {
    const {
      label = "Action",
      onClick,
      variant = "default",
      size = "md",
      disabled = false,
      // any other button props you want to pass through
      ...rest
    } = btnProps;

    // create click handler that passes row data
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      if (typeof onClick === "function") {
        try {
          onClick(data);
        } catch (err) {
          // swallow; parent can handle errors
          console.error("button field onClick error:", err);
        }
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`p-4 rounded-lg bg-blue-600/5 border border-border/50 hover:border-border/80 transition-colors ${
          field.className || ""
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <Icon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
                {field.label}
              </label>
            </div>
          </div>

          <div className="flex-shrink-0">
            <Button
              size={size as any}
              variant={variant as any}
              onClick={handleClick}
              disabled={disabled}
              {...(rest as any)}
            >
              {label}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // default display field
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-4 rounded-lg bg-blue-600/5 border border-border/50 hover:border-border/80 transition-colors ${
        field.className || ""
      }`}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <Icon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">
            {field.label}
          </label>
          <div className="text-sm font-semibold text-foreground break-words">
            {renderedValue === null || renderedValue === undefined ? (
              <span className="text-muted-foreground italic">—</span>
            ) : (
              renderedValue
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
