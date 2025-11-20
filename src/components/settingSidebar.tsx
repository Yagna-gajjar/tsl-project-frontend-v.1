import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Layers,
  IdCard,
  ArrowLeftFromLineIcon,
} from "lucide-react";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  submenu?: { label: string; href: string }[];
}

const menuItems: MenuItem[] = [
  {
    icon: Users, // Group of people
    label: "Family Type",
    href: "/settings/family-type",
  },
  {
    icon: Layers, // Categories / grouping
    label: "Team Category",
    href: "/settings/team-category",
  },
  {
    icon: IdCard, // Identity-related icon
    label: "Identity Type",
    href: "/settings/identity-type",
  },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(href);
  };

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute lg:hidden top-4 right-4 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-all"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: isOpen ? 0 : -320,
          width: isCollapsed ? 80 : 320,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-screen w-80 bg-background border-r border-border z-40 lg:translate-x-0 lg:relative flex flex-col overflow-hidden"
      >
        <motion.div>
          <div className="p-4">
            <div className="w-fit rounded-xl px-4 py-2 flex gap-3 items-center bg-primary/10">
              <ArrowLeftFromLineIcon className="w-5 h-5" />
              {!isCollapsed && (
                <Link to={"/dashboard"} className="font-medium">
                  Back
                </Link>
              )}
            </div>
          </div>
        </motion.div>
        {/* Collapse toggle button */}
        <motion.div className="absolute top-5 bg-background right-0 rounded-lg flex justify-center">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-full border hover:bg-accent transition-all text-muted-foreground hover:text-primary"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item, index) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isExpanded = expandedMenu === item.label;

            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {hasSubmenu ? (
                  <motion.button
                    onClick={() =>
                      setExpandedMenu(isExpanded ? null : item.label)
                    }
                    className="w-full flex items-center justify-between p-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        size={20}
                        className="group-hover:scale-110 transition-transform"
                      />
                      {!isCollapsed && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown size={18} />
                      </motion.div>
                    )}
                  </motion.button>
                ) : (
                  <Link
                    to={item.href!}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all group no-underline ${
                      isActive(item.href)
                        ? "bg-primary/20 text-primary border border-primary/50"
                        : "text-muted-foreground hover:text-primary hover:bg-accent"
                    }`}
                  >
                    <item.icon
                      size={20}
                      className="group-hover:scale-110 transition-transform"
                    />
                    {!isCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </Link>
                )}

                <AnimatePresence>
                  {hasSubmenu && isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 mt-2 space-y-1 border-l-2 border-primary/30">
                        {item.submenu?.map((sub) => (
                          <Link
                            key={sub.label}
                            to={sub.href}
                            onClick={handleNavClick}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all no-underline ${
                              isActive(sub.href)
                                ? "text-primary bg-primary/10 font-medium"
                                : "text-foreground/60 hover:text-primary hover:bg-accent"
                            }`}
                          >
                            <div className="w-2 h-2 rounded-full bg-primary/50" />
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </nav>

      </motion.div>
    </>
  );
}
