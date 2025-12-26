import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import { FormHeader } from "./form-header"
import { FormContent } from "./form-content"
import { FormFooter } from "./form-footer"
import type { FormModalProps, FormErrors } from "./types"
import { useIsMobile } from "@/hooks/use-mobile"
import { useToast } from "@/hooks/use-toast"

export function FormModal<T extends Record<string, string | number | Date | Object | boolean>>({
  isOpen,
  onClose,
  title,
  icon,
  fields,
  initialData,
  onSubmit,
  submitLabel = "Submit",
  layout = "grid",
}: FormModalProps<T>) {
  const [values, setValues] = useState<Partial<T>>(initialData || {})
  const [errors, setErrors] = useState<FormErrors<T>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const isMobile = useIsMobile()
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      setValues(initialData || {})
      setErrors({})
      setSubmitError(null)
    }
  }, [isOpen, initialData])

  const validateField = useCallback(
    (fieldName: keyof T, value: any): string | null => {
      const field = fields.find((f) => f.name === fieldName)
      if (!field) return null

      if (field.required && (value === "" || value === null || value === undefined)) {
        return `${field.label} is required`
      }

      switch (field.type) {
        case "email":
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return "Invalid email address"
          }
          break
        case "number":
          if (value && isNaN(Number(value))) {
            return "Must be a valid number"
          }
          break
      }

      if (field.validation) {
        const result = field.validation(value)
        if (result !== true) {
          return result
        }
      }

      return null
    },
    [fields],
  )

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors<T> = {}
    let isValid = true

    fields.forEach((field) => {
      const error = validateField(field.name, values[field.name])
      if (error) {
        newErrors[field.name] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [fields, values, validateField])

  const handleFieldChange = useCallback(
    (field: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [field]: value }))

      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }
    },
    [errors],
  )

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await onSubmit(values as T)
      toast({
        title: "Success",
        description: "Form submitted successfully",
      })
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit form"
      setSubmitError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <AnimatePresence>
        {isOpen && (
          <DialogContent
            className={`p-0 border-border/50 shadow-2xl rounded-xl overflow-hidden ${isMobile ? "w-[95vw] max-h-[95vh]" : "max-w-2xl max-h-[90vh]"
              }`}
          >
            <motion.div
              initial={{ opacity: 0, scale: isMobile ? 1 : 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: isMobile ? 1 : 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full max-h-[90vh]"
            >
              <FormHeader title={title} icon={icon} onClose={onClose} />

              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/50 hover:scrollbar-thumb-border">
                <FormContent<T>
                  fields={fields}
                  values={values}
                  errors={errors}
                  loading={false}
                  error={submitError}
                  isSubmitting={isSubmitting}
                  onChange={handleFieldChange}
                  layout={layout}
                />
              </div>

              <FormFooter
                onClose={onClose}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitLabel={submitLabel}
              />
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  )
}

export type { FormModalProps, FormFieldConfig } from "./types"
