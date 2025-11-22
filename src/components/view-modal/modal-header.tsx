"use client"

import { X } from "lucide-react"
import { motion } from "framer-motion"
import type React from "react"

interface ModalHeaderProps {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  onClose: () => void
}

export function ModalHeader({ title, icon: Icon, onClose }: ModalHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-b border-border/50 px-6 py-4 rounded-t-xl"
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5 text-blue-600" />}
        <h2 className="text-lg font-bold text-blue-600">{title}</h2>
      </div>
      <button
        onClick={onClose}
        className="p-2 hover:bg-muted/50 rounded-lg transition-colors duration-200"
        aria-label="Close modal"
      >
        <X className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
      </button>
    </motion.div>
  );
}
