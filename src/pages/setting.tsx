import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outlet } from "react-router-dom";
import SettingSidebar from "@/components/settingSidebar";
import RouteGuard from "@/components/route-guard";
import { Menu } from "lucide-react";

export default function Setting() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <motion.div
      className="min-h-screen bg-background text-foreground"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex">
        <div className="hidden lg:block">
          <SettingSidebar />
        </div>

        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 z-50 h-full lg:hidden"
              >
                <SettingSidebar onClose={() => setSidebarOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 h-screen overflow-auto w-[80%]">
          <div
            onClick={() => {
              setSidebarOpen(true);
            }}
            className="lg:hidden px-5 border-b border-border/50 py-3  `"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </div>
          <div className="pt-5 px-2">
            <RouteGuard>
              <Outlet />
            </RouteGuard>
          </div>
        </main>
      </div>
    </motion.div>
  );
}
