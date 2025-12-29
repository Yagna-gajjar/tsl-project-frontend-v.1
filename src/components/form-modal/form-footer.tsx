import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormFooterProps {
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
  disabled?: boolean;
}

export function FormFooter({
  onClose,
  onSubmit,
  isSubmitting,
  submitLabel = "Submit",
  disabled = false,
}: FormFooterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky bottom-0 border-t border-border/50 bg-background/95 backdrop-blur-sm px-6 py-4 flex gap-3 justify-end"
    >
      <Button
        variant="outline"
        onClick={onClose}
        disabled={isSubmitting}
        className="hover:bg-foreground/5 bg-transparent"
      >
        Cancel
      </Button>
      <Button
        onClick={onSubmit}
        disabled={isSubmitting || disabled}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {submitLabel}
      </Button>
    </motion.div>
  );
}
