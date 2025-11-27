import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  Menu,
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
  submenu: SubMenuItem[] | null;
  href?: string;
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
  {
    name: "Common Lookups",
    icon: Layers,
    submenu: null,
    href: "/setting/common-lookups",
  },
  {
    name: "Activity",
    icon: Menu,
    submenu: null,
    href: "/setting/activity",
  },
];

export default function SettingSidebar({ onClose }: { onClose?: () => void }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    "Family Settings": true,
  });

  const location = useLocation(); 
  const navigate = useNavigate();

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  const handleSectionClick = (section: NavigationItem) => {
    // If the main section has an href, navigate there.
    if (section.href) {
      navigate(section.href);
      if (onClose) onClose();
      return;
    }

    // Otherwise, only toggle when the sidebar is expanded (preserve original behavior).
    if (isExpanded) {
      toggleSection(section.name);
    }
  };
  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className={cn(
        "bg-card border-r mt-1 border-border h-screen transition-all duration-300 ease-in-out relative",
        isExpanded ? "w-72" : "w-16"
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleExpanded}
        className="absolute -right-3 bg-red-800 top-16 z-50 h-6 w-6 rounded-full border border-border bg-background shadow-md hidden lg:flex"
      >
        {isExpanded ? (
          <ChevronLeft className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </Button>
      <div className="p-5">
        <div className="mb-8">
          {/* Back Button */}
          <Link to="/dashboard">
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
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActiveTop = item.href
              ? location.pathname.indexOf(item.href) !== -1
              : false;
            const hasSubmenu =
              Array.isArray(item.submenu) && item.submenu.length > 0;
            const isSectionExpanded = expandedSections[item.name];

            const Icon = item.icon;
            if (item.href && !hasSubmenu) {
              return (
                <motion.div
                  key={item.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200",
                      isActiveTop
                        ? "bg-blue-600 text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                      !isExpanded && "justify-center"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.18 }}
                          className="font-medium whitespace-nowrap overflow-hidden"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </motion.div>
              );
            }

            // Otherwise (has submenu or no href), render header as button that toggles submenu when expanded
            return (
              <div key={item.name} className="space-y-1">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSectionClick(item)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200",
                    isActiveTop
                      ? "bg-blue-600 text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                    !isExpanded && "justify-center"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.18 }}
                        className="font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {isExpanded && hasSubmenu && (
                      <motion.div
                        initial={{ opacity: 0, rotate: -90 }}
                        animate={{
                          opacity: 1,
                          rotate: isSectionExpanded ? 0 : -90,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="ml-auto"
                      >
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Submenu */}
                <AnimatePresence>
                  {isSectionExpanded && hasSubmenu && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className={cn(
                        "space-y-1",
                        isExpanded
                          ? "ml-3 pl-6 border-l-2 border-border/30"
                          : "ml-0"
                      )}
                    >
                      {item.submenu!.map((sub) => {
                        const isActive =
                          location.pathname.indexOf(sub.href) !== -1;
                        const SubIcon = sub.icon ?? Icon;

                        return (
                          <motion.div
                            key={sub.href}
                            whileHover={{
                              x: isExpanded ? 2 : 0,
                              scale: !isExpanded ? 1.05 : 1,
                            }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Link
                              to={sub.href}
                              onClick={onClose}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                                isActive
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
                                !isExpanded && "justify-center"
                              )}
                            >
                              <SubIcon
                                className={cn(
                                  "h-4 w-4 flex-shrink-0",
                                  isActive && "scale-110"
                                )}
                              />
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                                  >
                                    {sub.label}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                              {isActive && isExpanded && (
                                <motion.div
                                  layoutId="activeIndicator"
                                  className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                                  transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                  }}
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
      </div>
    </motion.div>
  );
}


