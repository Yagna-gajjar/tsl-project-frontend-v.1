"use client"

import { useEffect, useState, useCallback } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ModalHeader } from "./modal-header"
import { ModalContent } from "./modal-content"
import type { ViewModalProps, ViewModalState, FieldConfig } from "./types"
import { motion, AnimatePresence } from "framer-motion"

export function ViewModal<T extends Record<string, any>>({
  isOpen,
  onClose,
  itemId,
  fields,
  title,
  layout = "grid",
  fetchFn,
  icon,
}: ViewModalProps<T>) {
  const [state, setState] = useState<ViewModalState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchData = useCallback(async () => {
    if (!isOpen || !itemId) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await fetchFn(itemId);
      setState({ data: result, loading: false, error: null });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load data";
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
    }
  }, [isOpen, itemId, fetchFn]);

  // Auto-fetch on modal open
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <AnimatePresence>
        {isOpen && (
          <DialogContent className="max-w-2xl p-0 border-border/50 shadow-2xl backdrop-blur-lg rounded-xl overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col max-h-[90vh] overflow-hidden"
            >
              <ModalHeader title={title} icon={icon} onClose={onClose} />

              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/50 hover:scrollbar-thumb-border">
                <ModalContent<T>
                  data={state.data}
                  fields={fields}
                  layout={layout}
                  loading={state.loading}
                  error={state.error}
                />
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

export type { ViewModalProps, FieldConfig }
