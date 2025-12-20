"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

import type { FormFieldConfig, FormErrors } from "./types"
import FormFieldInput from "./form-field-input";

interface FormContentProps<T extends Record<string, any>> {
  fields: FormFieldConfig<T>[];
  values: Partial<T>;
  errors: FormErrors<T>;
  loading: boolean;
  error: string | null;
  isSubmitting: boolean;
  onChange: (field: keyof T, value: any) => void;
  layout: "grid" | "list";
}

export function FormContent<T extends Record<string, any>>({
  fields,
  values,
  errors,
  loading,
  error,
  isSubmitting,
  onChange,
  layout,
}: FormContentProps<T>) {
  if (loading) {
    return (
      <div
        className={`p-6 space-y-6 ${
          layout === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 gap-6"
            : "space-y-4"
        }`}
      >
        {Array.from({ length: Math.min(fields.length, 4) }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24 bg-foreground/10" />
            <Skeleton className="h-10 bg-foreground/10" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 bg-background overflow-y-auto">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <Alert
              variant="destructive"
              className="border-red-500/50 bg-red-500/10"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={
          layout === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 gap-6"
            : "space-y-6"
        }
      >
        {fields.map((field, index) => (
          <FormFieldInput
            key={String(field.name)}
            type={field.type}
            name={String(field.name)}
            label={field.label}
            value={values[field.name] || ""}
            onChange={(val) => onChange(field.name, val)}
            placeholder={field.placeholder}
            description={field.description}
            required={field.required}
            error={errors[field.name]}
            options={field.options}
            icon={field.icon}
            disabled={field.disabled || isSubmitting}
            className={field.className}
            index={index}
            minDate={field.minDate}
            maxDate={field.maxDate}
            isLoadingMore={field.isLoadingMore}
            onLoadMore={field.onLoadMore}
          />
        ))}
      </div>
    </div>
  );
}
