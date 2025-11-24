import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Layers,
  IdCard,
  ArrowLeft,
  ChevronDown,
  Home,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface SubMenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavigationItem {
  name: string;
  icon: React.ElementType;
  submenu: SubMenuItem[];
}

const navigationItems: NavigationItem[] = [
  {
    name: "Family Settings",
    icon: Home,
    submenu: [
      { label: "Family Type", href: "/setting/family-type", icon: Users },
      { label: "Team Category", href: "/setting/team-category", icon: Layers },
      { label: "Identity Type", href: "/setting/identity-type", icon: IdCard },
    ],
  },
];

export default function SettingSidebar({ onClose }: { onClose?: () => void }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "Family Settings": true,
  });
  const location = useLocation();

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className={cn(
        "bg-gradient-to-b from-card to-card/95 border-r border-border/50 h-screen transition-all duration-300 ease-in-out relative shadow-lg",
        isExpanded ? "w-72" : "w-20"
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleExpanded}
        className="absolute -right-3 top-16 z-50 h-7 w-7 rounded-full border-2 border-border bg-background shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 hidden lg:flex items-center justify-center"
      >
        {isExpanded ? (
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      <div className="p-4 h-full flex flex-col">
        {/* Back Button */}
        <Link to="/dashboard" className="mb-8">
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-200" />
                <span>Back to Dashboard</span>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex justify-center"
              >
                <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110">
                  <ArrowLeft className="h-5 w-5" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {/* Settings Title */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="mb-6 px-2"
            >
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Settings
              </h3>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="space-y-2 flex-1 overflow-y-auto">
          {navigationItems.map((section) => {
            const SectionIcon = section.icon;
            const isSectionExpanded = expandedSections[section.name];

            return (
              <div key={section.name} className="space-y-1">
                {/* Section Header */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => isExpanded && toggleSection(section.name)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-accent/50 group",
                    !isExpanded && "justify-center"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-blue-600/10 text-blue-600 group-hover:bg-blue-600/20 transition-colors duration-200">
                      <SectionIcon className="h-4 w-4" />
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="font-semibold text-sm whitespace-nowrap overflow-hidden text-foreground"
                        >
                          {section.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{
                          opacity: 1,
                          rotate: isSectionExpanded ? 0 : -90
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Submenu Items */}
                <AnimatePresence>
                  {(isSectionExpanded || !isExpanded) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "space-y-1",
                        isExpanded ? "ml-3 pl-6 border-l-2 border-border/30" : "ml-0"
                      )}
                    >
                      {section.submenu.map((item) => {
                        const isActive = location.pathname === item.href;
                        const ItemIcon = item.icon;

                        return (
                          <motion.div
                            key={item.href}
                            whileHover={{ x: isExpanded ? 2 : 0, scale: !isExpanded ? 1.05 : 1 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Link
                              to={item.href}
                              onClick={onClose}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                                isActive
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                  : "text-muted-foreground hover:text-foreground hover:bg-accent/70",
                                !isExpanded && "justify-center"
                              )}
                            >
                              <ItemIcon className={cn(
                                "h-4 w-4 flex-shrink-0 transition-transform duration-200",
                                isActive && "scale-110"
                              )} />
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                                  >
                                    {item.label}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                              {isActive && isExpanded && (
                                <motion.div
                                  layoutId="activeIndicator"
                                  className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                              )}
                            </Link>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Footer Info */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="mt-auto pt-4 px-2 border-t border-border/50"
            >
              <p className="text-xs text-muted-foreground text-center">
                Settings Configuration
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}