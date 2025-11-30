"use client"

import { motion } from "framer-motion"
import { Search, X } from "lucide-react"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  disabled = false,
}: SearchInputProps) {
  return (
    <motion.div className="relative" whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }}>
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full pl-9 pr-8 py-2.5 border border-border/60 rounded-lg bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {value && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => onChange("")}
          className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </motion.button>
      )}
    </motion.div>
  )
}
