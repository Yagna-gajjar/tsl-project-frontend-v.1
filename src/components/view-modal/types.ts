import type React from "react"
/**
 * Field configuration for dynamic rendering
 */
export interface FieldConfig<T> {
  key: keyof T
  label: string
  icon?: React.ComponentType<{ className?: string }>
  render?: (value: any) => React.ReactNode
  className?: string
  type?: "text" | "button"
  button?: {
    label: string
    onClick?: (row: T) => void
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "sm" | "md" | "lg"
    disabled?: boolean
    span?: 1 | 2
  }
}

/**
 * Props for the ViewModal component
 */
export interface ViewModalProps<T> {
  isOpen: boolean
  onClose: () => void
  itemId: string | number
  fields: FieldConfig<T>[]
  title: string
  layout?: "grid" | "list"
  fetchFn: (id: string | number) => Promise<T>
  icon?: React.ComponentType<{ className?: string }>
}

/**
 * State management for modal data
 */
export interface ViewModalState<T> {
  data: T | null
  loading: boolean
  error: string | null
}
