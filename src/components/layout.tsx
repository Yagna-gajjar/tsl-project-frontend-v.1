import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "./navbar"
import Sidebar from "./sidebar"
import { Outlet } from "react-router-dom"

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <motion.div
      className="min-h-screen bg-background text-foreground"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="fixed top-0 left-0 right-0 z-40">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      </div>
      <div className="flex">
        {/* Desktop Sidebar - Fixed */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
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
                <Sidebar onClose={() => setSidebarOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 h-screen overflow-auto p-4 w-[80%]">
          <div className="pt-16">
            {/* Spacer for Navbar */}
            <Outlet />
          </div>
        </main>
      </div>
    </motion.div>
  );
}
