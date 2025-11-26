"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { FieldType } from "./types"

interface FormFieldInputProps {
  type: FieldType
  name: string
  label: string
  value: any
  onChange: (value: any) => void
  placeholder?: string
  description?: string
  required?: boolean
  error?: string
  options?: Array<{ label: string; value: any }>
  icon?: ReactNode
  disabled?: boolean
  className?: string
  index: number
}

export function FormFieldInput({
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
  icon,
  disabled,
  className,
  index,
}: FormFieldInputProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
      },
    }),
  }

  const errorVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: "auto" },
  }

  const renderInput = () => {
    switch (type) {
      case "textarea":
        return (
          <Textarea
            id={name}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`min-h-24 resize-none focus:ring-blue-500 focus:border-blue-500 ${
              error ? "border-red-500" : ""
            }`}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${name}-error` : description ? `${name}-desc` : undefined
            }
          />
        );

      case "select":
        return (
          <Select value={String(value || "")} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger
              className={`focus:ring-blue-500 focus:border-blue-500 ${error ? "border-red-500" : ""}`}
              aria-invalid={!!error}
            >
              <SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "checkbox":
        return (
          <div className="flex items-center gap-3 pt-1">
            <Checkbox
              id={name}
              checked={!!value}
              onCheckedChange={onChange}
              disabled={disabled}
              className="w-5 h-5"
              aria-invalid={!!error}
            />
            <Label htmlFor={name} className="font-normal cursor-pointer">
              {label}
            </Label>
          </div>
        )

      default:
        return (
          <Input
            id={name}
            type={type}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`focus:ring-blue-500 focus:border-blue-500 ${error ? "border-red-500" : ""}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : description ? `${name}-desc` : undefined}
          />
        )
    }
  }

  if (type === "checkbox") {
    return (
      <motion.div
        custom={index}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`flex flex-col gap-2 ${className}`}
      >
        {renderInput()}
        {description && (
          <p id={`${name}-desc`} className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {error && (
          <motion.p
            variants={errorVariants}
            initial="hidden"
            animate="visible"
            id={`${name}-error`}
            className="text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      custom={index}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`flex flex-col gap-2 ${className}`}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="text-blue-500">{icon}</span>}
        <Label htmlFor={name} className={`text-sm font-medium ${error ? "text-red-500" : ""}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      </div>
      {renderInput()}
      {description && (
        <p id={`${name}-desc`} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <motion.p
          variants={errorVariants}
          initial="hidden"
          animate="visible"
          id={`${name}-error`}
          className="text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  )
}
