"use client"

import { motion } from "framer-motion"

interface ModalFooterProps {
  onClose: () => void
}

export function ModalFooter({ onClose }: ModalFooterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="sticky bottom-0 border-t border-border/50 bg-gradient-to-t from-background/80 to-background/50 backdrop-blur-sm px-6 py-4 rounded-b-xl flex gap-3"
    >
      <button
        onClick={onClose}
        className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:scale-105 text-foreground font-medium transition-all duration-200 hover:shadow-md active:scale-95"
      >
        Close
      </button>
    </motion.div>
  )
}
