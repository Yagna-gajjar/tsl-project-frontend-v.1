import type React from "react";

export type FieldRenderFn<T, K extends keyof T> = (
  value: T[K],
  data: T
) => React.ReactNode;

export interface FieldConfig<T, K extends keyof T = keyof T> {
  key: K;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  render?: FieldRenderFn<T, K>;
  className?: string;
  type?: "text" | "button";

  button?: {
    label: string;
    onClick?: (row: T) => void;
    variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    span?: 1 | 2;
  };
}

export interface ViewModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  itemId: string | number;
  fields: FieldConfig<T>[];
  title: string;
  layout?: "grid" | "list";
  fetchFn: (id: string | number) => Promise<T>;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface ViewModalState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}