import { X } from "lucide-react"
import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface FormHeaderProps {
  title: string
  icon?: ReactNode
  onClose: () => void
}

export function FormHeader({ title, icon, onClose }: FormHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-background backdrop-blur-sm px-6 py-4"
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-blue-500 text-xl">{icon}</span>}
        <h2 className="text-xl font-bold text-blue-600">{title}</h2>
      </div>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClose}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted/50 text-foreground/70 hover:text-foreground transition-colors"
        aria-label="Close dialog"
      >
        <X className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
}
