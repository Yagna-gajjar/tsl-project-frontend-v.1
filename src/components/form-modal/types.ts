import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react"

export type FieldType = "text" | "email" | "password" | "number" | "textarea" | "select" | "checkbox" | "date" | "multiselect" | "time" | "Date"

export interface FormFieldConfig<T extends Record<string, any>> {
  name: keyof T;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  required?: boolean;
  validation?: (value: any) => string | true;
  options?: Array<{ label: string; value: any }>;
  icon?: ReactNode | LucideIcon;
  disabled?: boolean;
  className?: string;
  condition?: (values: Partial<T>) => boolean;
  minDate?: string | Date;
  maxDate?: string | Date;
}

export interface FormModalProps<T extends Record<string, any>> {
  isOpen: boolean
  onClose: () => void
  title: string
  icon?: ReactNode
  fields: FormFieldConfig<T>[]
  initialData?: Partial<T>
  onSubmit: (data: T) => Promise<void> | void
  submitLabel?: string
  layout?: "grid" | "list"
}

export interface FormModalState {
  loading: boolean
  error: string | null
  submitError: string | null
  isSubmitting: boolean
}

export type FormErrors<T> = Partial<Record<keyof T, string>>
